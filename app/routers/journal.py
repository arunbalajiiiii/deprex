from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from google import genai
from google.genai import types
import json

from app.models.database import get_db, User, Journal
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/journal", tags=["journal"])

# Initialize Google GenAI client (resolves key from settings or GEMINI_API_KEY env)
client = genai.Client(api_key=settings.GEMINI_API_KEY or None)


# ── Schemas ────────────────────────────────────────────────────────────────────

class JournalEntryRequest(BaseModel):
    content: str


class SentimentResponseSchema(BaseModel):
    score: float  # -1.0 to 1.0
    label: str    # "positive" | "neutral" | "negative"


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def save_journal(
    body: JournalEntryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sentiment, label = await _analyse_sentiment(body.content)

    entry = Journal(
        user_id=user.id,
        content=body.content,
        sentiment=sentiment,
        label=label,
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


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _analyse_sentiment(text: str) -> tuple[float, str]:
    """Ask Gemini to score sentiment -1.0 to 1.0 and return (score, label)."""
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=f"Analyse the sentiment of this journal entry: {text[:800]}",
            config=types.GenerateContentConfig(
                system_instruction="Analyze the sentiment of the text. Score must be between -1.0 (very negative) and 1.0 (very positive). Label must be one of 'positive', 'neutral', or 'negative'.",
                response_mime_type="application/json",
                response_schema=SentimentResponseSchema,
            )
        )
        data = json.loads(response.text)
        score = float(max(-1.0, min(1.0, data.get("score", 0.0))))
        label = data.get("label", "neutral")
        if label not in ["positive", "neutral", "negative"]:
            label = "neutral"
        return score, label
    except Exception:
        return 0.0, "neutral"
