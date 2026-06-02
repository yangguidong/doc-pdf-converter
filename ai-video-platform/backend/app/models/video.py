from typing import Optional
import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    generation_type: Mapped[str] = mapped_column(String(20), nullable=False)
    source_image_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    source_video_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    output_video_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    output_thumbnail_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    credits_cost: Mapped[int] = mapped_column(Integer, default=0)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="videos")
    task = relationship("GenerationTask", back_populates="video", uselist=False, lazy="selectin")
