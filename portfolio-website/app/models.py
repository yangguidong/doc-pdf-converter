"""SQLAlchemy ORM models for the portfolio website."""

import json
from datetime import datetime, timezone
from app.database import db
from app.utils import get_upload_url


def utcnow():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {"id": self.id, "username": self.username}


# ---------------------------------------------------------------------------
# HeroConfig (singleton)
# ---------------------------------------------------------------------------


class HeroConfig(db.Model):
    __tablename__ = "hero_config"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    background_type = db.Column(db.String(20), default="gradient")  # gradient|image|video
    background_url = db.Column(db.String(500), nullable=True)
    gradient_start = db.Column(db.String(7), default="#0f172a")
    gradient_end = db.Column(db.String(7), default="#334155")
    greeting_text = db.Column(db.String(200), default="Hello, I am")
    name = db.Column(db.String(200), nullable=False, default="Your Name")
    tagline = db.Column(db.Text, nullable=True, default="Artist & Designer")
    show_scroll_hint = db.Column(db.Boolean, default=True)

    @classmethod
    def get(cls):
        """Get (or create) the singleton hero config."""
        cfg = cls.query.first()
        if cfg is None:
            cfg = cls()
            db.session.add(cfg)
            db.session.flush()
        return cfg

    def to_dict(self):
        return {
            "background_type": self.background_type,
            "background_url": self.background_url,
            "gradient_start": self.gradient_start,
            "gradient_end": self.gradient_end,
            "greeting_text": self.greeting_text,
            "name": self.name,
            "tagline": self.tagline,
            "show_scroll_hint": self.show_scroll_hint,
        }


# ---------------------------------------------------------------------------
# Profile (singleton)
# ---------------------------------------------------------------------------


class Profile(db.Model):
    __tablename__ = "profile"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False, default="Your Name")
    tagline = db.Column(db.String(300), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    artistic_philosophy = db.Column(db.Text, nullable=True)
    avatar_media_id = db.Column(db.Integer, db.ForeignKey("media.id"), nullable=True)
    cv_media_id = db.Column(db.Integer, db.ForeignKey("media.id"), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    avatar = db.relationship("Media", foreign_keys=[avatar_media_id], lazy="joined")
    cv = db.relationship("Media", foreign_keys=[cv_media_id], lazy="joined")

    @classmethod
    def get(cls):
        p = cls.query.first()
        if p is None:
            p = cls()
            db.session.add(p)
            db.session.flush()
        return p

    def to_dict(self):
        return {
            "name": self.name,
            "tagline": self.tagline,
            "bio": self.bio,
            "artistic_philosophy": self.artistic_philosophy,
            "avatar_url": get_upload_url(self.avatar.file_path) if self.avatar else None,
            "avatar_media_id": self.avatar_media_id,
            "cv_url": get_upload_url(self.cv.file_path) if self.cv else None,
            "cv_media_id": self.cv_media_id,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
        }


# ---------------------------------------------------------------------------
# Work
# ---------------------------------------------------------------------------


class Work(db.Model):
    __tablename__ = "works"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(300), nullable=False)
    subtitle = db.Column(db.String(300), nullable=True)
    slug = db.Column(db.String(300), unique=True, nullable=False)
    category = db.Column(db.String(100), nullable=False, index=True, default="other")
    description = db.Column(db.Text, nullable=True)
    tools = db.Column(db.Text, nullable=True)  # JSON array: ["Figma","Photoshop"]
    date_created = db.Column(db.Date, nullable=True)
    cover_media_id = db.Column(db.Integer, db.ForeignKey("media.id"), nullable=True)
    is_published = db.Column(db.Boolean, default=True, index=True)
    is_featured = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    view_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    cover = db.relationship("Media", foreign_keys=[cover_media_id], lazy="joined")
    gallery = db.relationship(
        "WorkImage", back_populates="work", cascade="all, delete-orphan",
        order_by="WorkImage.sort_order"
    )
    videos = db.relationship(
        "WorkVideo", back_populates="work", cascade="all, delete-orphan",
        order_by="WorkVideo.sort_order"
    )

    def to_public_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "slug": self.slug,
            "category": self.category,
            "description": self.description,
            "tools": json.loads(self.tools) if self.tools else [],
            "date_created": self.date_created.isoformat() if self.date_created else None,
            "cover_url": get_upload_url(self.cover.file_path) if self.cover else None,
            "cover_thumb_url": get_upload_url(self.cover.thumbnail_path) if self.cover else None,
            "is_featured": self.is_featured,
            "sort_order": self.sort_order,
            "view_count": self.view_count,
            "gallery": [wi.to_dict() for wi in self.gallery],
            "videos": [wv.to_dict() for wv in self.videos],
        }

    def to_admin_dict(self):
        d = self.to_public_dict()
        d["cover_media_id"] = self.cover_media_id
        d["is_published"] = self.is_published
        d["created_at"] = self.created_at.isoformat() if self.created_at else None
        d["updated_at"] = self.updated_at.isoformat() if self.updated_at else None
        return d


# ---------------------------------------------------------------------------
# WorkImage (many-to-many: Work <-> Media)
# ---------------------------------------------------------------------------


class WorkImage(db.Model):
    __tablename__ = "work_images"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    work_id = db.Column(db.Integer, db.ForeignKey("works.id", ondelete="CASCADE"), nullable=False)
    media_id = db.Column(db.Integer, db.ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    sort_order = db.Column(db.Integer, default=0)

    __table_args__ = (db.UniqueConstraint("work_id", "media_id"),)

    work = db.relationship("Work", back_populates="gallery")
    media = db.relationship("Media", lazy="joined")

    def to_dict(self):
        return {
            "id": self.id,
            "media_id": self.media_id,
            "sort_order": self.sort_order,
            "url": get_upload_url(self.media.file_path) if self.media else None,
            "thumb_url": get_upload_url(self.media.thumbnail_path) if self.media else None,
            "width": self.media.width if self.media else None,
            "height": self.media.height if self.media else None,
            "alt_text": self.media.alt_text if self.media else None,
        }


# ---------------------------------------------------------------------------
# WorkVideo
# ---------------------------------------------------------------------------


class WorkVideo(db.Model):
    __tablename__ = "work_videos"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    work_id = db.Column(db.Integer, db.ForeignKey("works.id", ondelete="CASCADE"), nullable=False)
    platform = db.Column(db.String(20), default="direct")  # youtube|vimeo|direct
    video_url = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(200), nullable=True)
    sort_order = db.Column(db.Integer, default=0)

    work = db.relationship("Work", back_populates="videos")

    def to_dict(self):
        return {
            "id": self.id,
            "platform": self.platform,
            "video_url": self.video_url,
            "title": self.title,
            "sort_order": self.sort_order,
        }


# ---------------------------------------------------------------------------
# Media
# ---------------------------------------------------------------------------


class Media(db.Model):
    __tablename__ = "media"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    original_filename = db.Column(db.String(500), nullable=False)
    stored_filename = db.Column(db.String(200), unique=True, nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    thumbnail_path = db.Column(db.String(500), nullable=True)
    file_size = db.Column(db.Integer, nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    alt_text = db.Column(db.String(300), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "url": get_upload_url(self.file_path),
            "thumb_url": get_upload_url(self.thumbnail_path),
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "width": self.width,
            "height": self.height,
            "alt_text": self.alt_text,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


# ---------------------------------------------------------------------------
# Exhibition (timeline / awards)
# ---------------------------------------------------------------------------


class Exhibition(db.Model):
    __tablename__ = "exhibitions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(300), nullable=False)
    date_display = db.Column(db.String(100), nullable=False)  # "Oct 2025", "2025"
    description = db.Column(db.Text, nullable=True)
    venue = db.Column(db.String(300), nullable=True)
    type = db.Column(db.String(50), default="exhibition")  # exhibition|award|publication|speaking|education
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "date_display": self.date_display,
            "description": self.description,
            "venue": self.venue,
            "type": self.type,
            "sort_order": self.sort_order,
        }


# ---------------------------------------------------------------------------
# SocialLink
# ---------------------------------------------------------------------------


class SocialLink(db.Model):
    __tablename__ = "social_links"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    platform = db.Column(db.String(50), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    label = db.Column(db.String(100), nullable=True)
    sort_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "platform": self.platform,
            "url": self.url,
            "label": self.label or self.platform.capitalize(),
            "sort_order": self.sort_order,
        }


# ---------------------------------------------------------------------------
# SiteConfig (key-value)
# ---------------------------------------------------------------------------


class SiteConfig(db.Model):
    __tablename__ = "site_config"

    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=False, default="")

    @classmethod
    def get_all(cls):
        return {c.key: c.value for c in cls.query.all()}

    @classmethod
    def set_many(cls, data: dict):
        """Partial update — sets only the keys present in `data`."""
        for key, value in data.items():
            cfg = cls.query.get(key)
            if cfg is None:
                cfg = cls(key=key, value=str(value) if value is not None else "")
                db.session.add(cfg)
            else:
                cfg.value = str(value) if value is not None else ""

    @classmethod
    def seed_defaults(cls):
        defaults = {
            "site_title": "Portfolio",
            "site_description": "Art & Design Portfolio",
            "google_analytics_id": "",
            "email_notification_enabled": "false",
            "smtp_host": "",
            "smtp_port": "587",
            "smtp_username": "",
            "smtp_password": "",
            "smtp_use_tls": "true",
            "notification_email": "",
            "footer_text": "© 2025 All Rights Reserved",
            "custom_css": "",
            "custom_js": "",
        }
        for k, v in defaults.items():
            if cls.query.get(k) is None:
                db.session.add(cls(key=k, value=v))
