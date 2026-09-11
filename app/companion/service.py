from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import User, ChatMessage, ChatEvent
from app.intelligence.provider import IntelligenceProvider
from app.intelligence.schemas import CompanionMessage
from app.wellbeing.service import WellbeingService
from app.companion.schemas import (
    ChatMessageItem,
    ChatHistoryResponse,
    CompanionChatResponse,
)
from app.companion.guardrails import detect_crisis_intent, CRISIS_SAFETY_REPLY


class CompanionService:
    """Deep module managing conversation lifecycle, persistent history, and crisis guardrails."""

    def __init__(
        self,
        db: AsyncSession,
        intelligence: IntelligenceProvider,
        wellbeing: WellbeingService,
    ):
        self.db = db
        self.intelligence = intelligence
        self.wellbeing = wellbeing

    async def send_message(
        self,
        user: User,
        content: str,
        override_messages: Optional[list[CompanionMessage]] = None,
        override_risk: Optional[float] = None,
        override_interests: Optional[list[str]] = None,
    ) -> CompanionChatResponse:
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Deterministic Crisis Guardrail check
        if detect_crisis_intent(content):
            # Save user message
            user_msg = ChatMessage(user_id=user.id, role="user", content=content)
            # Save immediate safety response
            assistant_msg = ChatMessage(user_id=user.id, role="assistant", content=CRISIS_SAFETY_REPLY)
            self.db.add(user_msg)
            self.db.add(assistant_msg)

            # Record crisis audit event
            crisis_event = ChatEvent(
                user_id=user.id,
                level="crisis",
                risk_delta=1.0,
                flags=["crisis_guardrail_triggered"],
            )
            self.db.add(crisis_event)

            await self.db.commit()
            return CompanionChatResponse(
                reply=CRISIS_SAFETY_REPLY,
                is_crisis_intervention=True,
                createdAt=now_iso,
            )

        # 2. Persist user message
        user_msg = ChatMessage(user_id=user.id, role="user", content=content)
        self.db.add(user_msg)
        await self.db.flush()

        # 3. Assemble conversation context
        if override_messages:
            context_messages = override_messages
        else:
            history_result = await self.db.execute(
                select(ChatMessage)
                .where(ChatMessage.user_id == user.id)
                .order_by(ChatMessage.id.desc())
                .limit(20)
            )
            recent_db_messages = list(reversed(history_result.scalars().all()))
            context_messages = [
                CompanionMessage(role=m.role, content=m.content)
                for m in recent_db_messages
            ]

        # 4. Resolve clinical risk posture
        if override_risk is not None:
            risk_label = (
                "high" if override_risk > 0.6 else
                "moderate" if override_risk > 0.35 else
                "low"
            )
        else:
            summary = await self.wellbeing.get_patient_summary(user.id)
            if summary.has_active_risk_flag or (summary.latest_risk and summary.latest_risk > 0.6):
                risk_label = "high"
            elif (summary.latest_risk and summary.latest_risk > 0.35) or (
                summary.sentiment_avg_30d is not None and summary.sentiment_avg_30d < -0.2
            ):
                risk_label = "moderate"
            else:
                risk_label = "low"

        # 5. Resolve user interests
        interests = override_interests if override_interests is not None else (user.interests or [])

        # 6. Generate empathetic response
        reply = await self.intelligence.generate_companion_reply(
            user_name=user.name,
            messages=context_messages,
            risk_level=risk_label,
            interests=interests,
        )

        # 7. Persist assistant reply
        assistant_msg = ChatMessage(user_id=user.id, role="assistant", content=reply)
        self.db.add(assistant_msg)
        await self.db.commit()
        await self.db.refresh(assistant_msg)

        return CompanionChatResponse(
            reply=reply,
            is_crisis_intervention=False,
            createdAt=assistant_msg.created_at.isoformat() if assistant_msg.created_at else now_iso,
        )

    async def get_history(self, user_id: int, limit: int = 50) -> ChatHistoryResponse:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.id.desc())
            .limit(limit)
        )
        messages = list(reversed(result.scalars().all()))
        items = [
            ChatMessageItem(
                id=m.id,
                role=m.role,
                content=m.content,
                createdAt=m.created_at.isoformat() if m.created_at else datetime.now(timezone.utc).isoformat(),
            )
            for m in messages
        ]
        return ChatHistoryResponse(messages=items)
