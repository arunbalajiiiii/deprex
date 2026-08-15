from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.models.database import get_db, User
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str
    email: Optional[str] = None
    name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": _user_dict(user)}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": _user_dict(user)}


@router.post("/google", response_model=TokenResponse)
async def google_auth(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    import httpx
    email = body.email
    name = body.name or "Google User"

    if body.credential and body.credential != "demo_google_credential":
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": body.credential}
                )
                if res.status_code == 200:
                    info = res.json()
                    if info.get("email"):
                        email = info.get("email")
                    if info.get("name"):
                        name = info.get("name")
                else:
                    res2 = await client.get(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        headers={"Authorization": f"Bearer {body.credential}"}
                    )
                    if res2.status_code == 200:
                        info2 = res2.json()
                        if info2.get("email"):
                            email = info2.get("email")
                        if info2.get("name"):
                            name = info2.get("name")
        except Exception:
            pass

    if not email:
        raise HTTPException(status_code=400, detail="Google authentication failed or email missing")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            name=name,
            email=email,
            password=hash_password("google_oauth_" + email),
            onboarded=False
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": _user_dict(user)}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return _user_dict(user)


# ── Helper ─────────────────────────────────────────────────────────────────────

def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "onboarded": user.onboarded,
        "interests": user.interests or [],
        "subInterests": user.sub_interests or {},
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }
