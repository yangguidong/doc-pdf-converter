from sqlalchemy import String, Integer, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime


class GameSkin(Base):
    __tablename__ = "game_skins"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    css_class: Mapped[str] = mapped_column(String(100), default="default")
    is_preset: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Game(Base):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    module_type: Mapped[str] = mapped_column(String(50), nullable=False)
    params_json: Mapped[str] = mapped_column(Text, default="{}")
    skin_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("game_skins.id"), nullable=True)
    share_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    punishment_type: Mapped[str] = mapped_column(String(50), default="text")
    punishment_config: Mapped[str] = mapped_column(Text, default="{}")
    play_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class PlayRecord(Base):
    __tablename__ = "play_records"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    game_id: Mapped[int] = mapped_column(Integer, ForeignKey("games.id"), index=True, nullable=False)
    player_name: Mapped[str] = mapped_column(String(50), default="匿名玩家")
    score: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    played_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
