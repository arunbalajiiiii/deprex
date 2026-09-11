from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal

from app.models.database import User
from app.auth import get_current_user
from app.intelligence import (
    IntelligenceProvider,
    get_intelligence,
    CompanionMessage,
    IntelligenceUnavailableError,
)
from app.companion import (
    CompanionService,
    get_companion_service,
    ChatHistoryResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ChatMessageInput(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    content: Optional[str] = None
    messages: Optional[list[ChatMessageInput]] = None
    risk: Optional[float] = None
    interests: Optional[list[str]] = None


class PersonaliseRequest(BaseModel):
    interest: str
    description: str            # user's free text
    resources: list[dict]       # [{title, note, cta, ...}, ...]


# ── Chat ───────────────────────────────────────────────────────────────────────

@router.post("/chat")
async def chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    companion: CompanionService = Depends(get_companion_service),
):
    """
    Send a message to the companion. Handles deterministic crisis guardrails,
    persists conversation history in the database, and queries Gemini.
    """
    # Extract user message: support both new { content } and legacy { messages }
    if body.content and body.content.strip():
        user_message = body.content.strip()
    elif body.messages and len(body.messages) > 0:
        # Get last user message from legacy conversation list
        user_messages = [m for m in body.messages if m.role == "user"]
        user_message = user_messages[-1].content if user_messages else body.messages[-1].content
    else:
        raise HTTPException(status_code=400, detail="A non-empty 'content' or 'messages' list is required.")

    override_messages = None
    if body.messages:
        override_messages = [
            CompanionMessage(role=m.role, content=m.content)
            for m in body.messages
        ]

    try:
        result = await companion.send_message(
            user=user,
            content=user_message,
            override_messages=override_messages,
            override_risk=body.risk,
            override_interests=body.interests,
        )
        return {
            "reply": result.reply,
            "isCrisisIntervention": result.is_crisis_intervention,
            "createdAt": result.createdAt,
        }
    except IntelligenceUnavailableError as e:
        raise HTTPException(status_code=502, detail=e.message)


@router.get("/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    user: User = Depends(get_current_user),
    companion: CompanionService = Depends(get_companion_service),
):
    """Retrieve persistent conversation history for the current user."""
    return await companion.get_history(user_id=user.id)


# ── Personalise resources ─────────────────────────────────────────────────────

@router.post("/personalise")
async def personalise_resources(
    body: PersonaliseRequest,
    user: User = Depends(get_current_user),
    intelligence: IntelligenceProvider = Depends(get_intelligence),
):
    """
    Given a user's free-text description of what they enjoy about an interest,
    return the resource list reordered from most to least relevant.
    """
    order = await intelligence.rank_resources(
        interest=body.interest,
        preference=body.description,
        resources=body.resources,
    )
    return {"order": order}
