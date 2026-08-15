import os
import sys

# Ensure both project root and app directory are in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_current_dir, ".."))

if _root_dir not in sys.path:
    sys.path.insert(0, _root_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import traceback

# Safe lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from app.models.database import init_db
        await init_db()       # create tables on startup if they don't exist
    except Exception as e:
        print(f"[Warning] init_db failed on startup: {e}", file=sys.stderr)
        traceback.print_exc()
    yield


app = FastAPI(
    title="Deprex API",
    description="Mental health support backend for Deprex",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (Safe inclusion) ───────────────────────────────────────────────────
_import_errors = []

for module_name in ["auth", "user", "journal", "assessment", "events", "ai"]:
    try:
        import importlib
        router_mod = importlib.import_module(f"app.routers.{module_name}")
        app.include_router(router_mod.router)
    except Exception as e:
        err_msg = f"Failed to import router app.routers.{module_name}: {e}"
        print(f"[Critical] {err_msg}", file=sys.stderr)
        traceback.print_exc()
        _import_errors.append(f"{err_msg}\n{traceback.format_exc()}")


@app.get("/health")
async def health():
    if _import_errors:
        return {"status": "degraded", "service": "Deprex API", "import_errors": _import_errors}
    return {"status": "ok", "service": "Deprex API"}


@app.get("/")
async def root():
    return {"status": "ok", "service": "Deprex API", "docs": "/docs"}

