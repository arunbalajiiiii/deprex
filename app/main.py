from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.database import init_db
from app.routers import auth, user, journal, assessment, events, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()       # create tables on startup if they don't exist
    yield


app = FastAPI(
    title="Deprex API",
    description="Mental health support backend for Deprex",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# In production replace * with your actual frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(journal.router)
app.include_router(assessment.router)
app.include_router(events.router)
app.include_router(ai.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Deprex API"}
