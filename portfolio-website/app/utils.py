"""Utility functions — slug generation, file upload processing, image resizing."""

import re
import uuid
from pathlib import Path
from PIL import Image

from app.config import Config

UPLOAD_DIR = Path(Config.UPLOAD_FOLDER)
IMAGE_DIR = UPLOAD_DIR / "images"
THUMB_DIR = UPLOAD_DIR / "thumbnails"
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "application/pdf",
}
MAX_IMAGE_WIDTH = 2400
THUMB_WIDTH = 400


def slugify(text):
    """Generate a URL-friendly slug from text."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text[:200].strip("-")


def unique_slug(base_slug, existing_slugs_set):
    """Return base_slug if unique, else base_slug-2, base_slug-3, etc."""
    if base_slug not in existing_slugs_set:
        return base_slug
    n = 2
    while f"{base_slug}-{n}" in existing_slugs_set:
        n += 1
    return f"{base_slug}-{n}"


def allowed_file(mime_type):
    return mime_type in ALLOWED_MIME_TYPES


def process_upload(file_storage):
    """Save uploaded file, generate thumbnail if image. Returns metadata dict."""
    ext = Path(file_storage.filename).suffix.lower() if file_storage.filename else ""
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = IMAGE_DIR / stored_name

    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    file_storage.save(str(file_path))

    mime = file_storage.content_type or ""
    metadata = {
        "original_filename": file_storage.filename or "unknown",
        "stored_filename": stored_name,
        "file_path": str(file_path.relative_to(UPLOAD_DIR)),
        "file_size": file_path.stat().st_size,
        "mime_type": mime,
        "width": None,
        "height": None,
        "thumbnail_path": None,
    }

    if mime.startswith("image/") and mime != "image/svg+xml":
        try:
            img = Image.open(file_path)
            metadata["width"], metadata["height"] = img.size

            # Resize if wider than MAX_IMAGE_WIDTH
            if img.width > MAX_IMAGE_WIDTH:
                ratio = MAX_IMAGE_WIDTH / img.width
                new_size = (MAX_IMAGE_WIDTH, int(img.height * ratio))
                img = img.resize(new_size, Image.LANCZOS)
                img.save(file_path, optimize=True, quality=85)
                metadata["file_size"] = file_path.stat().st_size

            # Generate thumbnail
            THUMB_DIR.mkdir(parents=True, exist_ok=True)
            thumb_name = f"thumb_{stored_name}"
            thumb_path = THUMB_DIR / thumb_name
            thumb = img.copy()
            thumb.thumbnail((THUMB_WIDTH, THUMB_WIDTH), Image.LANCZOS)
            thumb.save(thumb_path, optimize=True, quality=80)
            metadata["thumbnail_path"] = str(thumb_path.relative_to(UPLOAD_DIR))

            img.close()
        except Exception as e:
            print(f"Image processing warning: {e}")

    return metadata


def delete_upload(file_path, thumbnail_path=None):
    """Remove uploaded files from disk."""
    if file_path:
        (UPLOAD_DIR / file_path).unlink(missing_ok=True)
    if thumbnail_path:
        (UPLOAD_DIR / thumbnail_path).unlink(missing_ok=True)


def get_upload_url(relative_path):
    """Convert a relative upload path to a URL path."""
    if not relative_path:
        return None
    sanitized = relative_path.replace("\\", "/")
    return f"/uploads/{sanitized}"
