"""Authentication helpers — session-based auth via Flask sessions."""

from functools import wraps
from flask import session, jsonify
from app.database import db
from app.models import User


def login_required(f):
    """Decorator that returns 401 JSON if not logged in."""

    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)

    return decorated


def login_user(user_id):
    session["user_id"] = user_id
    session.permanent = True


def logout_user():
    session.pop("user_id", None)


def get_current_user():
    """Return the User object for the current session, or None."""
    user_id = session.get("user_id")
    if user_id is None:
        return None
    return db.session.get(User, user_id)


def seed_admin_user():
    """Create default admin user if no users exist."""
    if User.query.count() == 0:
        from werkzeug.security import generate_password_hash

        user = User(
            username="admin",
            password_hash=generate_password_hash("admin123", method="scrypt"),
        )
        db.session.add(user)
        db.session.flush()
        return user
    return None
