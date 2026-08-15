from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.models.database import get_db, User, Assessment
from app.auth import get_current_user

router = APIRouter(prefix="/assessment", tags=["assessment"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    score: int
    risk: float
    answers: list[int]


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def save_assessment(
    body: AssessmentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = Assessment(
        user_id=user.id,
        score=body.score,
        risk=round(max(0.0, min(1.0, body.risk)), 4),
        answers=body.answers,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return {
        "id": entry.id,
        "score": entry.score,
        "risk": entry.risk,
        "createdAt": entry.created_at.isoformat(),
    }


@router.get("/latest")
async def get_latest(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assessment)
        .where(Assessment.user_id == user.id)
        .order_by(Assessment.created_at.desc())
        .limit(1)
    )
    a = result.scalar_one_or_none()
    if not a:
        return None
    return {"score": a.score, "risk": a.risk, "createdAt": a.created_at.isoformat()}
