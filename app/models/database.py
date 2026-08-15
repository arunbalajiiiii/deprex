from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func
from app.config import settings


def _create_engine():
    db_url = getattr(settings, "DATABASE_URL", "") or "sqlite+aiosqlite:///./deprex.db"
    # Auto-convert postgresql url to asyncpg format if needed
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("sqlite:///") and "+aiosqlite" not in db_url:
        db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return create_async_engine(db_url, echo=False)

try:
    engine = _create_engine()
except Exception as e:
    print(f"[Warning] Failed to initialize primary async engine ({e}). Falling back to in-memory/tmp SQLite.")
    engine = create_async_engine("sqlite+aiosqlite:////tmp/deprex.db", echo=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    password    = Column(String, nullable=False)           # bcrypt hash
    onboarded   = Column(Boolean, default=False)
    interests   = Column(JSON, default=list)               # ["Chess", "Yoga", ...]
    sub_interests = Column(JSON, default=dict)             # {"Chess": "I love tactics..."}
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    journals        = relationship("Journal",       back_populates="user", cascade="all, delete")
    assessments     = relationship("Assessment",    back_populates="user", cascade="all, delete")
    relief_events   = relationship("ReliefEvent",   back_populates="user", cascade="all, delete")
    chat_events     = relationship("ChatEvent",     back_populates="user", cascade="all, delete")
    chat_messages   = relationship("ChatMessage",   back_populates="user", cascade="all, delete")


class Journal(Base):
    __tablename__ = "journals"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    content     = Column(Text, nullable=False)
    sentiment   = Column(Float, nullable=True)             # -1.0 to 1.0
    label       = Column(String, nullable=True)            # "positive" / "neutral" / "negative"
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="journals")


class Assessment(Base):
    __tablename__ = "assessments"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    score       = Column(Integer, nullable=False)          # PHQ-9 style score
    risk        = Column(Float, nullable=False)            # 0.0 to 1.0
    answers     = Column(JSON, default=list)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="assessments")


class ReliefEvent(Base):
    __tablename__ = "relief_events"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    interest_key    = Column(String, nullable=False)
    resource_title  = Column(String, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="relief_events")


class ChatEvent(Base):
    __tablename__ = "chat_events"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    level       = Column(String, nullable=False)           # crisis/severe/moderate/mild/positive/neutral
    risk_delta  = Column(Float, default=0.0)
    mood_delta  = Column(Float, default=0.0)
    flags       = Column(JSON, default=list)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_events")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    role        = Column(String, nullable=False)           # "user" / "assistant"
    content     = Column(Text, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_messages")


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSession(engine) as session:
        yield session
