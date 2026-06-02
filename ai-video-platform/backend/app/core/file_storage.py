from typing import Optional
import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from ..config import settings


def _ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_upload_dir(user_id: int, category: str) -> Path:
    return _ensure_dir(Path(settings.UPLOAD_DIR) / category / str(user_id))


def get_generated_video_dir(user_id: int) -> Path:
    return _ensure_dir(Path(settings.GENERATED_DIR) / "videos" / str(user_id))


def get_thumbnail_dir() -> Path:
    return _ensure_dir(Path(settings.GENERATED_DIR) / "thumbnails")


async def save_upload(user_id: int, file: UploadFile, category: str) -> str:
    ext = Path(file.filename).suffix if file.filename else ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_dir = get_upload_dir(user_id, category)
    dest_path = dest_dir / filename

    content = await file.read()
    dest_path.write_bytes(content)

    rel_path = f"{category}/{user_id}/{filename}"
    return rel_path


def save_generated_video(user_id: int, content: bytes, ext: str = ".mp4") -> Path:
    dest_dir = get_generated_video_dir(user_id)
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / filename
    dest_path.write_bytes(content)
    return dest_path


def get_full_path(relative_path: str) -> Path:
    """Resolve a relative storage path to absolute."""
    base = Path(settings.UPLOAD_DIR).parent
    return base / relative_path


def delete_video_files(video_path: Optional[str], thumbnail_path: Optional[str]) -> None:
    if video_path:
        fp = get_full_path(video_path)
        if fp.exists():
            fp.unlink()
    if thumbnail_path:
        fp = get_full_path(thumbnail_path)
        if fp.exists():
            fp.unlink()
