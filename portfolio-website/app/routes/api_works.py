"""Admin API for works CRUD, gallery, and videos."""

import json
from datetime import date
from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Work, WorkImage, WorkVideo, Media

from app.utils import slugify, unique_slug

api_works_bp = Blueprint("api_works", __name__)


# ---------------------------------------------------------------------------
# List / Create
# ---------------------------------------------------------------------------

@api_works_bp.route("/works", methods=["GET"])
def list_works():
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    status = request.args.get("status", "").strip()  # published|draft|all
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    sort_by = request.args.get("sort_by", "sort_order")
    sort_dir = request.args.get("sort_dir", "asc")

    q = Work.query

    if search:
        q = q.filter(Work.title.ilike(f"%{search}%"))
    if category and category != "all":
        q = q.filter_by(category=category)
    if status == "published":
        q = q.filter_by(is_published=True)
    elif status == "draft":
        q = q.filter_by(is_published=False)

    # Sort
    col_map = {
        "sort_order": Work.sort_order,
        "created_at": Work.created_at,
        "updated_at": Work.updated_at,
        "title": Work.title,
    }
    col = col_map.get(sort_by, Work.sort_order)
    if sort_dir == "desc":
        col = col.desc()
    q = q.order_by(col)

    total = q.count()
    works = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "works": [w.to_admin_dict() for w in works],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    })


@api_works_bp.route("/works/categories/admin", methods=["GET"])
def admin_list_categories():
    rows = (
        db.session.query(Work.category, db.func.count(Work.id))
        .group_by(Work.category)
        .order_by(Work.category)
        .all()
    )
    return jsonify({
        "categories": [{"name": cat, "count": cnt} for cat, cnt in rows]
    })


@api_works_bp.route("/works", methods=["POST"])
def create_work():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    existing_slugs = {w.slug for w in Work.query.with_entities(Work.slug).all()}
    slug = unique_slug(slugify(title), existing_slugs)

    work = Work(
        title=title,
        subtitle=data.get("subtitle", "").strip() or None,
        slug=slug,
        category=data.get("category", "other").strip(),
        description=data.get("description", "").strip() or None,
        tools=json.dumps(data.get("tools", []), ensure_ascii=False),
        date_created=date.fromisoformat(data["date_created"]) if data.get("date_created") else None,
        cover_media_id=data.get("cover_media_id"),
        is_published=data.get("is_published", True),
        is_featured=data.get("is_featured", False),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(work)
    db.session.flush()

    # Gallery images
    for idx, media_id in enumerate(data.get("gallery_media_ids", []) or []):
        db.session.add(WorkImage(work_id=work.id, media_id=media_id, sort_order=idx))

    # Videos
    for idx, vid in enumerate(data.get("videos", []) or []):
        db.session.add(WorkVideo(
            work_id=work.id,
            platform=vid.get("platform", "direct"),
            video_url=vid["video_url"],
            title=vid.get("title", ""),
            sort_order=idx,
        ))

    db.session.commit()
    return jsonify({"work": work.to_admin_dict()}), 201


# ---------------------------------------------------------------------------
# Get / Update / Delete
# ---------------------------------------------------------------------------

@api_works_bp.route("/works/<int:work_id>", methods=["GET"])
def get_work(work_id):
    work = Work.query.get_or_404(work_id)
    return jsonify({"work": work.to_admin_dict()})


@api_works_bp.route("/works/<int:work_id>", methods=["PUT"])
def update_work(work_id):
    work = Work.query.get_or_404(work_id)
    data = request.get_json(silent=True) or {}

    if "title" in data:
        work.title = data["title"].strip()
        # Regenerate slug if title changed
        if slugify(work.title) != work.slug:
            existing_slugs = {
                w.slug for w in Work.query.with_entities(Work.slug).all() if w.id != work.id
            }
            work.slug = unique_slug(slugify(work.title), existing_slugs)
    if "subtitle" in data:
        work.subtitle = data["subtitle"].strip() or None
    if "category" in data:
        work.category = data["category"].strip()
    if "description" in data:
        work.description = data["description"] or None
    if "tools" in data:
        work.tools = json.dumps(data["tools"], ensure_ascii=False)
    if "date_created" in data:
        work.date_created = (
            date.fromisoformat(data["date_created"]) if data["date_created"] else None
        )
    if "cover_media_id" in data:
        work.cover_media_id = data["cover_media_id"]
    if "is_published" in data:
        work.is_published = data["is_published"]
    if "is_featured" in data:
        work.is_featured = data["is_featured"]
    if "sort_order" in data:
        work.sort_order = data["sort_order"]

    db.session.commit()
    return jsonify({"work": work.to_admin_dict()})


@api_works_bp.route("/works/<int:work_id>", methods=["DELETE"])
def delete_work(work_id):
    work = Work.query.get_or_404(work_id)
    db.session.delete(work)
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Quick toggle endpoints
# ---------------------------------------------------------------------------

@api_works_bp.route("/works/<int:work_id>/publish", methods=["PATCH"])
def toggle_publish(work_id):
    work = Work.query.get_or_404(work_id)
    data = request.get_json(silent=True) or {}
    work.is_published = data.get("is_published", not work.is_published)
    db.session.commit()
    return jsonify({"ok": True, "is_published": work.is_published})


@api_works_bp.route("/works/<int:work_id>/feature", methods=["PATCH"])
def toggle_feature(work_id):
    work = Work.query.get_or_404(work_id)
    data = request.get_json(silent=True) or {}
    work.is_featured = data.get("is_featured", not work.is_featured)
    db.session.commit()
    return jsonify({"ok": True, "is_featured": work.is_featured})


# ---------------------------------------------------------------------------
# Gallery images
# ---------------------------------------------------------------------------

@api_works_bp.route("/works/<int:work_id>/images", methods=["POST"])
def add_gallery_images(work_id):
    work = Work.query.get_or_404(work_id)
    data = request.get_json(silent=True) or {}
    media_ids = data.get("media_ids", [])
    if not media_ids:
        return jsonify({"error": "media_ids is required"}), 400

    next_order = max((wi.sort_order for wi in work.gallery), default=-1) + 1
    for idx, mid in enumerate(media_ids):
        exists = WorkImage.query.filter_by(work_id=work_id, media_id=mid).first()
        if exists:
            continue
        db.session.add(WorkImage(work_id=work_id, media_id=mid, sort_order=next_order + idx))

    db.session.commit()
    return jsonify({"gallery": [wi.to_dict() for wi in work.gallery]})


@api_works_bp.route("/works/<int:work_id>/images/<int:media_id>", methods=["DELETE"])
def remove_gallery_image(work_id, media_id):
    wi = WorkImage.query.filter_by(work_id=work_id, media_id=media_id).first_or_404()
    db.session.delete(wi)
    db.session.commit()
    return jsonify({"ok": True})


@api_works_bp.route("/works/<int:work_id>/images/sort", methods=["PUT"])
def sort_gallery_images(work_id):
    data = request.get_json(silent=True) or {}
    image_ids = data.get("image_ids", [])  # ordered list of work_image IDs

    for idx, wi_id in enumerate(image_ids):
        wi = WorkImage.query.get(wi_id)
        if wi and wi.work_id == work_id:
            wi.sort_order = idx
    db.session.commit()

    work = Work.query.get(work_id)
    return jsonify({"gallery": [wi.to_dict() for wi in work.gallery]})


# ---------------------------------------------------------------------------
# Videos
# ---------------------------------------------------------------------------

@api_works_bp.route("/works/<int:work_id>/videos", methods=["POST"])
def add_video(work_id):
    Work.query.get_or_404(work_id)
    data = request.get_json(silent=True) or {}
    if not data.get("video_url"):
        return jsonify({"error": "video_url is required"}), 400

    max_order = db.session.query(
        db.func.max(WorkVideo.sort_order)
    ).filter_by(work_id=work_id).scalar() or -1

    vid = WorkVideo(
        work_id=work_id,
        platform=data.get("platform", "direct"),
        video_url=data["video_url"],
        title=data.get("title", ""),
        sort_order=max_order + 1,
    )
    db.session.add(vid)
    db.session.commit()
    return jsonify({"video": vid.to_dict()}), 201


@api_works_bp.route("/works/<int:work_id>/videos/<int:video_id>", methods=["PUT"])
def update_video(work_id, video_id):
    vid = WorkVideo.query.filter_by(id=video_id, work_id=work_id).first_or_404()
    data = request.get_json(silent=True) or {}
    if "platform" in data:
        vid.platform = data["platform"]
    if "video_url" in data:
        vid.video_url = data["video_url"]
    if "title" in data:
        vid.title = data.get("title", "")
    if "sort_order" in data:
        vid.sort_order = data["sort_order"]
    db.session.commit()
    return jsonify({"video": vid.to_dict()})


@api_works_bp.route("/works/<int:work_id>/videos/<int:video_id>", methods=["DELETE"])
def delete_video(work_id, video_id):
    vid = WorkVideo.query.filter_by(id=video_id, work_id=work_id).first_or_404()
    db.session.delete(vid)
    db.session.commit()
    return jsonify({"ok": True})
