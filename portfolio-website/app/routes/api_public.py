"""Public read-only API routes for the frontend."""

from flask import Blueprint, jsonify, request
from app.database import db
from app.models import (
    HeroConfig, Profile, Work, WorkImage, WorkVideo,
    Exhibition, SocialLink, SiteConfig
)

api_public_bp = Blueprint("api_public", __name__)


# ---------------------------------------------------------------------------
# Hero
# ---------------------------------------------------------------------------

@api_public_bp.route("/hero")
def get_hero():
    return jsonify(HeroConfig.get().to_dict())


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@api_public_bp.route("/profile")
def get_profile():
    return jsonify(Profile.get().to_dict())


# ---------------------------------------------------------------------------
# Works
# ---------------------------------------------------------------------------

@api_public_bp.route("/works")
def list_works():
    category = request.args.get("category", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)
    search = request.args.get("search", "").strip()
    featured = request.args.get("featured", "").strip()

    q = Work.query.filter_by(is_published=True)

    if category and category != "all":
        q = q.filter_by(category=category)
    if search:
        q = q.filter(Work.title.ilike(f"%{search}%"))
    if featured == "true":
        q = q.filter_by(is_featured=True)

    q = q.order_by(Work.sort_order.asc(), Work.created_at.desc())

    total = q.count()
    works = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "works": [w.to_public_dict() for w in works],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    })


@api_public_bp.route("/works/categories")
def list_categories():
    """Return distinct categories with counts."""
    rows = (
        db.session.query(Work.category, db.func.count(Work.id))
        .filter_by(is_published=True)
        .group_by(Work.category)
        .order_by(Work.category)
        .all()
    )
    return jsonify({
        "categories": [{"name": cat, "count": cnt} for cat, cnt in rows]
    })


@api_public_bp.route("/works/<slug>")
def get_work(slug):
    work = Work.query.filter_by(slug=slug, is_published=True).first_or_404()
    work.view_count = (work.view_count or 0) + 1
    db.session.commit()
    return jsonify({"work": work.to_public_dict()})


@api_public_bp.route("/works/related/<slug>")
def related_works(slug):
    work = Work.query.filter_by(slug=slug).first_or_404()
    related = (
        Work.query
        .filter(
            Work.is_published == True,
            Work.category == work.category,
            Work.id != work.id,
        )
        .order_by(Work.sort_order.asc(), Work.created_at.desc())
        .limit(6)
        .all()
    )
    return jsonify({
        "works": [w.to_public_dict() for w in related]
    })


# ---------------------------------------------------------------------------
# Exhibitions
# ---------------------------------------------------------------------------

@api_public_bp.route("/exhibitions")
def list_exhibitions():
    type_filter = request.args.get("type", "").strip()
    q = Exhibition.query
    if type_filter:
        q = q.filter_by(type=type_filter)
    items = q.order_by(Exhibition.sort_order.asc()).all()
    return jsonify({"exhibitions": [e.to_dict() for e in items]})


# ---------------------------------------------------------------------------
# Social Links
# ---------------------------------------------------------------------------

@api_public_bp.route("/social-links")
def list_social_links():
    items = SocialLink.query.order_by(SocialLink.sort_order.asc()).all()
    return jsonify({"social_links": [s.to_dict() for s in items]})


# ---------------------------------------------------------------------------
# Site Config (public subset)
# ---------------------------------------------------------------------------

@api_public_bp.route("/site-config")
def get_site_config():
    keys_str = request.args.get("keys", "")
    all_config = SiteConfig.get_all()
    if keys_str:
        keys = [k.strip() for k in keys_str.split(",") if k.strip()]
        return jsonify({k: all_config.get(k, "") for k in keys})
    return jsonify(all_config)
