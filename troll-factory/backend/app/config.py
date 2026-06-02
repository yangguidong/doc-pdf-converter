from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Troll Factory"
    database_url: str = "sqlite+aiosqlite:///./data/troll_factory.db"
    jwt_secret_key: str = "troll-factory-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    host: str = "0.0.0.0"
    port: int = 8000
    game_output_dir: str = "../games"
    frontend_dist_dir: str = "../frontend/dist"
    site_url: str = "http://localhost:8000"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
