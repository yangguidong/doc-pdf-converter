"""SQLAlchemy database setup."""

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    """Initialize database — create tables if they don't exist."""
    db.init_app(app)
    with app.app_context():
        import app.models  # noqa: ensure models are loaded
        db.create_all()
