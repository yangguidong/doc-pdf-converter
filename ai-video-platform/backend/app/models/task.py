from typing import Optional
import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class GenerationTask(Base):
    __tablename__ = "generation_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), unique=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    task_type: Mapped[str] = mapped_column(String(20), nullable=False)
    model_name: Mapped[str] = mapped_column(String(50), nullable=False)
    input_params: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="queued")
    external_task_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    result_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    started_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    user = relationship("User", back_populates="tasks")
    video = relationship("Video", back_populates="task")
