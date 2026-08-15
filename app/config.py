import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    SECRET_KEY: str = "change-me-in-production"
    DATABASE_URL: str = "sqlite+aiosqlite:///./deprex.db"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    def __init__(self, **values):
        super().__init__(**values)
        # If running on Vercel and it's SQLite, redirect it to /tmp to avoid Read-Only Filesystem error
        if os.environ.get("VERCEL") and self.DATABASE_URL.startswith("sqlite+aiosqlite:///."):
            self.DATABASE_URL = "sqlite+aiosqlite:////tmp/deprex.db"

    class Config:
        env_file = ".env"
        extra = "ignore"


from pydantic import ValidationError

try:
    settings = Settings()
except ValidationError as e:
    print(f"[Critical] Settings validation failed during boot: {e}")
    for error in e.errors():
        print(f"  Field: {error.get('loc')}, Error: {error.get('msg')}, Input: {repr(error.get('input'))}")
    
    # Fallback settings to allow the server to start and report logs
    class FallbackSettings:
        ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
        GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
        SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
        DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:////tmp/deprex.db" if os.environ.get("VERCEL") else "sqlite+aiosqlite:///./deprex.db")
        # Parse ACCESS_TOKEN_EXPIRE_MINUTES safely
        try:
            ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
        except Exception:
            ACCESS_TOKEN_EXPIRE_MINUTES = 10080

    settings = FallbackSettings()
