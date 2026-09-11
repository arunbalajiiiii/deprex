from typing import Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.database import User, Assessment, Journal, ChatEvent
from app.intelligence.provider import IntelligenceProvider
from app.wellbeing.schemas import (
    AssessmentSubmission,
    AssessmentResponse,
    PatientWellbeingSummary,
)
from app.wellbeing.scorer import evaluate_phq9


class WellbeingService:
    """Deep service encapsulating clinical assessment invariants and patient wellbeing analytics."""

    def __init__(self, db: AsyncSession, intelligence: IntelligenceProvider):
        self.db = db
        self.intelligence = intelligence

    async def record_assessment(
        self,
        user: User,
        submission: AssessmentSubmission,
    ) -> AssessmentResponse:
        evaluation = evaluate_phq9(
            answers=submission.answers,
            fallback_score=submission.score,
            fallback_risk=submission.risk,
        )

        # Contextual insight / safety response
        if evaluation.has_suicidal_ideation or evaluation.risk > 0.6:
            coping_insight = (
                "Your responses indicate significant distress right now. "
                "Please remember that free, confidential crisis support is available 24/7 at 988. "
                "You do not have to carry this alone."
            )
        elif evaluation.severity in ("Mild", "Moderate"):
            primary_interest = (user.interests[0] if user.interests else "a mindful pause")
            coping_insight = (
                f"You are experiencing some emotional weight. Taking time for {primary_interest} "
                "or a grounding breathing break may help restore focus today."
            )
        else:
            coping_insight = "Your symptoms are currently in a mild or balanced range. Keep taking gentle care of yourself."

        # Persist Assessment
        entry = Assessment(
            user_id=user.id,
            score=evaluation.score,
            risk=evaluation.risk,
            answers=submission.answers or [],
        )
        self.db.add(entry)

        # Automatically emit and record audit ChatEvent timeline record atomically
        level = (
            "crisis" if evaluation.has_suicidal_ideation else
            "severe" if evaluation.score >= 20 else
            "moderate" if evaluation.score >= 10 else
            "mild" if evaluation.score >= 5 else
            "neutral"
        )
        flags = ["suicide_risk"] if evaluation.has_suicidal_ideation else []
        timeline_event = ChatEvent(
            user_id=user.id,
            level=level,
            risk_delta=evaluation.risk,
            mood_delta=-0.5 if evaluation.score >= 15 else 0.0,
            flags=flags,
        )
        self.db.add(timeline_event)

        await self.db.commit()
        await self.db.refresh(entry)

        return AssessmentResponse(
            id=entry.id,
            score=evaluation.score,
            risk=evaluation.risk,
            severity=evaluation.severity,
            has_suicidal_ideation=evaluation.has_suicidal_ideation,
            coping_insight=coping_insight,
            createdAt=entry.created_at.isoformat() if entry.created_at else datetime.now(timezone.utc).isoformat(),
        )

    async def get_latest_assessment(self, user_id: int) -> Optional[dict]:
        result = await self.db.execute(
            select(Assessment)
            .where(Assessment.user_id == user_id)
            .order_by(Assessment.created_at.desc())
            .limit(1)
        )
        a = result.scalar_one_or_none()
        if not a:
            return None

        evaluation = evaluate_phq9(
            answers=a.answers,
            fallback_score=a.score,
            fallback_risk=a.risk,
        )

        return {
            "id": a.id,
            "score": a.score,
            "risk": a.risk,
            "severity": evaluation.severity,
            "hasSuicideRisk": evaluation.has_suicidal_ideation,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
        }

    async def get_patient_summary(self, user_id: int) -> PatientWellbeingSummary:
        # Fetch latest assessment
        latest_res = await self.db.execute(
            select(Assessment)
            .where(Assessment.user_id == user_id)
            .order_by(Assessment.created_at.desc())
            .limit(2)
        )
        assessments = latest_res.scalars().all()
        latest_assessment = assessments[0] if assessments else None
        previous_assessment = assessments[1] if len(assessments) > 1 else None

        # Count total assessments
        count_res = await self.db.execute(
            select(func.count(Assessment.id)).where(Assessment.user_id == user_id)
        )
        total_assessments = count_res.scalar_one() or 0

        # Fetch journals from last 30 days
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        journals_res = await self.db.execute(
            select(Journal)
            .where(Journal.user_id == user_id, Journal.created_at >= cutoff)
            .order_by(Journal.created_at.asc())
        )
        journals = journals_res.scalars().all()

        sentiments = [j.sentiment for j in journals if j.sentiment is not None]
        sentiment_avg = round(sum(sentiments) / len(sentiments), 3) if sentiments else None

        # Determine trajectory trend
        trend = "insufficient_data"
        if len(sentiments) >= 4:
            first_half = sentiments[:len(sentiments)//2]
            second_half = sentiments[len(sentiments)//2:]
            avg1 = sum(first_half) / len(first_half)
            avg2 = sum(second_half) / len(second_half)
            delta = avg2 - avg1
            if delta > 0.15:
                trend = "improving"
            elif delta < -0.15:
                trend = "declining"
            else:
                trend = "stable"
        elif latest_assessment and previous_assessment:
            score_delta = latest_assessment.score - previous_assessment.score
            if score_delta <= -3:
                trend = "improving"
            elif score_delta >= 3:
                trend = "declining"
            else:
                trend = "stable"

        # Evaluate risk flags
        has_flag = False
        latest_severity = None
        latest_score = None
        latest_risk = None
        if latest_assessment:
            eval_res = evaluate_phq9(
                answers=latest_assessment.answers,
                fallback_score=latest_assessment.score,
                fallback_risk=latest_assessment.risk,
            )
            latest_score = eval_res.score
            latest_risk = eval_res.risk
            latest_severity = eval_res.severity
            has_flag = eval_res.has_suicidal_ideation

        # Determine suggested companion posture
        if has_flag or (latest_risk and latest_risk > 0.6):
            posture = "crisis-support"
        elif (latest_risk and latest_risk > 0.35) or (sentiment_avg and sentiment_avg < -0.2):
            posture = "compassionate-grounding"
        else:
            posture = "reflective-growth"

        return PatientWellbeingSummary(
            latest_score=latest_score,
            latest_risk=latest_risk,
            latest_severity=latest_severity,
            has_active_risk_flag=has_flag,
            assessment_count=total_assessments,
            journal_count_30d=len(journals),
            sentiment_avg_30d=sentiment_avg,
            trend=trend,
            suggested_companion_posture=posture,
        )
