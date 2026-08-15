from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.models.database import get_db, User
from app.auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class UpdateInterestsRequest(BaseModel):
    interests: list[str]
    sub_interests: Optional[dict[str, str]] = {}
    onboarded: Optional[bool] = True


class UpdateSubInterestRequest(BaseModel):
    interest: str
    description: str        # free text — "I love tactical chess puzzles..."


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.put("/interests")
async def update_interests(
    body: UpdateInterestsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.interests = body.interests
    user.sub_interests = body.sub_interests or {}
    if body.onboarded:
        user.onboarded = True
    await db.commit()
    await db.refresh(user)
    return {
        "interests": user.interests,
        "subInterests": user.sub_interests,
        "onboarded": user.onboarded,
    }


@router.patch("/sub-interest")
async def update_sub_interest(
    body: UpdateSubInterestRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a single interest's free-text preference without touching the rest."""
    subs = dict(user.sub_interests or {})
    if body.description.strip():
        subs[body.interest] = body.description.strip()
    else:
        subs.pop(body.interest, None)    # empty string = clear preference
    user.sub_interests = subs
    await db.commit()
    return {"subInterests": user.sub_interests}
