"""Admin authentication API routes."""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from app.database import db
from app.models import User
from app.auth import login_required, login_user, logout_user, get_current_user

api_auth_bp = Blueprint("api_auth", __name__)


@api_auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    login_user(user.id)
    return jsonify({"ok": True, "user": user.to_dict()})


@api_auth_bp.route("/logout", methods=["POST"])
def logout():
    logout_user()
    return jsonify({"ok": True})


@api_auth_bp.route("/me", methods=["GET"])
def me():
    user = get_current_user()
    return jsonify({"user": user.to_dict()})


@api_auth_bp.route("/change-password", methods=["PUT"])
def change_password():
    data = request.get_json(silent=True) or {}
    current = data.get("current_password", "")
    new = data.get("new_password", "")

    if not current or not new:
        return jsonify({"error": "Both passwords are required"}), 400
    if len(new) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400

    user = get_current_user()
    if not check_password_hash(user.password_hash, current):
        return jsonify({"error": "Current password is incorrect"}), 401

    user.password_hash = generate_password_hash(new, method="scrypt")
    db.session.commit()
    return jsonify({"ok": True})
