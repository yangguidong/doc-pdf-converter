"""Admin API for profile, hero, exhibitions, and social links management."""

from flask import Blueprint, request, jsonify
from app.database import db
from app.models import HeroConfig, Profile, Exhibition, SocialLink

api_profile_bp = Blueprint("api_profile", __name__)


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@api_profile_bp.route("/profile", methods=["GET"])
def get_profile():
    return jsonify(Profile.get().to_dict())


@api_profile_bp.route("/profile", methods=["PUT"])
def update_profile():
    profile = Profile.get()
    data = request.get_json(silent=True) or {}
    for field in [
        "name", "tagline", "bio", "artistic_philosophy",
        "avatar_media_id", "cv_media_id", "email", "phone", "location",
    ]:
        if field in data:
            setattr(profile, field, data[field] or None)
    db.session.commit()
    return jsonify(profile.to_dict())


# ---------------------------------------------------------------------------
# Hero
# ---------------------------------------------------------------------------

@api_profile_bp.route("/hero", methods=["GET"])
def get_hero():
    return jsonify(HeroConfig.get().to_dict())


@api_profile_bp.route("/hero", methods=["PUT"])
def update_hero():
    hero = HeroConfig.get()
    data = request.get_json(silent=True) or {}
    for field in [
        "background_type", "background_url",
        "gradient_start", "gradient_end",
        "greeting_text", "name", "tagline", "show_scroll_hint",
    ]:
        if field in data:
            setattr(hero, field, data[field])
    db.session.commit()
    return jsonify(hero.to_dict())


# ---------------------------------------------------------------------------
# Exhibitions
# ---------------------------------------------------------------------------

@api_profile_bp.route("/exhibitions", methods=["GET"])
def list_exhibitions():
    items = Exhibition.query.order_by(Exhibition.sort_order.asc()).all()
    return jsonify({"exhibitions": [e.to_dict() for e in items]})


@api_profile_bp.route("/exhibitions", methods=["POST"])
def create_exhibition():
    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"error": "Title is required"}), 400
    ex = Exhibition(
        title=data["title"],
        date_display=data.get("date_display", ""),
        description=data.get("description", ""),
        venue=data.get("venue", ""),
        type=data.get("type", "exhibition"),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(ex)
    db.session.commit()
    return jsonify({"exhibition": ex.to_dict()}), 201


@api_profile_bp.route("/exhibitions/<int:ex_id>", methods=["PUT"])
def update_exhibition(ex_id):
    ex = Exhibition.query.get_or_404(ex_id)
    data = request.get_json(silent=True) or {}
    for field in ["title", "date_display", "description", "venue", "type", "sort_order"]:
        if field in data:
            setattr(ex, field, data[field])
    db.session.commit()
    return jsonify({"exhibition": ex.to_dict()})


@api_profile_bp.route("/exhibitions/<int:ex_id>", methods=["DELETE"])
def delete_exhibition(ex_id):
    ex = Exhibition.query.get_or_404(ex_id)
    db.session.delete(ex)
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Social Links
# ---------------------------------------------------------------------------

@api_profile_bp.route("/social-links", methods=["GET"])
def list_social_links():
    items = SocialLink.query.order_by(SocialLink.sort_order.asc()).all()
    return jsonify({"social_links": [s.to_dict() for s in items]})


@api_profile_bp.route("/social-links", methods=["POST"])
def create_social_link():
    data = request.get_json(silent=True) or {}
    if not data.get("platform") or not data.get("url"):
        return jsonify({"error": "platform and url are required"}), 400
    link = SocialLink(
        platform=data["platform"],
        url=data["url"],
        label=data.get("label", data["platform"]),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(link)
    db.session.commit()
    return jsonify({"social_link": link.to_dict()}), 201


@api_profile_bp.route("/social-links/<int:link_id>", methods=["PUT"])
def update_social_link(link_id):
    link = SocialLink.query.get_or_404(link_id)
    data = request.get_json(silent=True) or {}
    for field in ["platform", "url", "label", "sort_order"]:
        if field in data:
            setattr(link, field, data[field])
    db.session.commit()
    return jsonify({"social_link": link.to_dict()})


@api_profile_bp.route("/social-links/<int:link_id>", methods=["DELETE"])
def delete_social_link(link_id):
    link = SocialLink.query.get_or_404(link_id)
    db.session.delete(link)
    db.session.commit()
    return jsonify({"ok": True})
