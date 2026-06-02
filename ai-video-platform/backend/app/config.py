import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"

    JWT_SECRET_KEY: str = "ai-video-platform-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    RUNWAY_API_KEY: str = ""
    PIKA_API_KEY: str = ""
    KLING_API_KEY: str = ""
    STABILITY_API_KEY: str = ""

    UPLOAD_DIR: str = str(BASE_DIR / "data" / "uploads")
    GENERATED_DIR: str = str(BASE_DIR / "data" / "generated")

    DEFAULT_SIGNUP_CREDITS: int = 50
    MAX_VIDEO_FILE_SIZE_MB: int = 500

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
