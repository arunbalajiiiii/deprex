from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.models.database import get_db, User, ReliefEvent, ChatEvent
from app.auth import get_current_user

router = APIRouter(tags=["events"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ReliefEventRequest(BaseModel):
    interest_key: str
    resource_title: str


class ChatEventRequest(BaseModel):
    level: str                      # crisis/severe/moderate/mild/positive/neutral
    risk_delta: float = 0.0
    mood_delta: float = 0.0
    flags: Optional[list[str]] = []


# ── Relief events ──────────────────────────────────────────────────────────────

@router.post("/relief-events", status_code=201)
async def log_relief_event(
    body: ReliefEventRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = ReliefEvent(
        user_id=user.id,
        interest_key=body.interest_key,
        resource_title=body.resource_title,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return {"id": event.id, "createdAt": event.created_at.isoformat()}


@router.get("/relief-events")
async def get_relief_events(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ReliefEvent)
        .where(ReliefEvent.user_id == user.id)
        .order_by(ReliefEvent.created_at.desc())
        .limit(500)
    )
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "interestKey": e.interest_key,
            "resourceTitle": e.resource_title,
            "date": e.created_at.isoformat(),
        }
        for e in events
    ]


# ── Chat events ────────────────────────────────────────────────────────────────

@router.post("/chat-events", status_code=201)
async def log_chat_event(
    body: ChatEventRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = ChatEvent(
        user_id=user.id,
        level=body.level,
        risk_delta=body.risk_delta,
        mood_delta=body.mood_delta,
        flags=body.flags or [],
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return {"id": event.id, "createdAt": event.created_at.isoformat()}


@router.get("/chat-events")
async def get_chat_events(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatEvent)
        .where(ChatEvent.user_id == user.id)
        .order_by(ChatEvent.created_at.desc())
        .limit(200)
    )
    events = result.scalars().all()
    return [
        {
            "id": e.id,
            "level": e.level,
            "riskDelta": e.risk_delta,
            "moodDelta": e.mood_delta,
            "flags": e.flags,
            "date": e.created_at.isoformat(),
        }
        for e in events
    ]
