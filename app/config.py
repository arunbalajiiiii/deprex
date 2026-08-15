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


settings = Settings()
