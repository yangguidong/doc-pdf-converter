from typing import Optional
import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from ..database import Base


class ModelConfig(Base):
    __tablename__ = "model_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    model_key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    api_base_url: Mapped[str] = mapped_column(String(300), nullable=False)
    api_key_env: Mapped[str] = mapped_column(String(100), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    supported_types: Mapped[str] = mapped_column(Text, nullable=False)
    max_duration: Mapped[int] = mapped_column(Integer, default=10)
    supported_resolutions: Mapped[str] = mapped_column(Text, nullable=False)
    credits_per_generation: Mapped[int] = mapped_column(Integer, default=10)
    extra_config: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
