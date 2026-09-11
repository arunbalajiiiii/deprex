from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.models.database import get_db, User, Journal
from app.auth import get_current_user
from app.intelligence import IntelligenceProvider, get_intelligence

router = APIRouter(prefix="/journal", tags=["journal"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class JournalEntryRequest(BaseModel):
    content: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def save_journal(
    body: JournalEntryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    intelligence: IntelligenceProvider = Depends(get_intelligence),
):
    sentiment_result = await intelligence.analyze_sentiment(body.content)

    entry = Journal(
        user_id=user.id,
        content=body.content,
        sentiment=sentiment_result.score,
        label=sentiment_result.label,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    return {
        "id": entry.id,
        "sentiment": entry.sentiment,
        "label": entry.label,
        "createdAt": entry.created_at.isoformat(),
    }


@router.get("/")
async def get_journals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user.id)
        .order_by(Journal.created_at.desc())
        .limit(90)   # last 90 entries for graph
    )
    journals = result.scalars().all()
    return [
        {
            "id": j.id,
            "content": j.content,
            "sentiment": j.sentiment,
            "label": j.label,
            "createdAt": j.created_at.isoformat(),
        }
        for j in journals
    ]
