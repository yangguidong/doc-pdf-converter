import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="user")
    credits: Mapped[int] = mapped_column(Integer, default=0)
    total_credits_used: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    last_login_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    videos = relationship("Video", back_populates="user", lazy="selectin")
    tasks = relationship("GenerationTask", back_populates="user", lazy="selectin")
