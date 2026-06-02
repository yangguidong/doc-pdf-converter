"""Admin API for media library management."""

from flask import Blueprint, request, jsonify
from app.database import db
from app.models import Media, WorkImage, Work
from app.utils import allowed_file, process_upload, delete_upload

api_media_bp = Blueprint("api_media", __name__)


@api_media_bp.route("/media", methods=["GET"])
def list_media():
    media_type = request.args.get("type", "").strip()  # image|video|all
    search = request.args.get("search", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 40, type=int)

    q = Media.query

    if media_type == "image":
        q = q.filter(Media.mime_type.ilike("image/%"))
    elif media_type == "video":
        q = q.filter(Media.mime_type.ilike("video/%"))

    if search:
        q = q.filter(Media.original_filename.ilike(f"%{search}%"))

    q = q.order_by(Media.uploaded_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "media": [m.to_dict() for m in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": max(1, (total + per_page - 1) // per_page),
    })


@api_media_bp.route("/media", methods=["POST"])
def upload_media():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f or not f.filename:
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(f.content_type or ""):
        return jsonify({"error": f"File type {f.content_type} not allowed"}), 400

    metadata = process_upload(f)
    media = Media(
        original_filename=metadata["original_filename"],
        stored_filename=metadata["stored_filename"],
        file_path=metadata["file_path"],
        thumbnail_path=metadata.get("thumbnail_path"),
        file_size=metadata["file_size"],
        mime_type=metadata["mime_type"],
        width=metadata["width"],
        height=metadata["height"],
    )
    db.session.add(media)
    db.session.commit()

    return jsonify({"media": media.to_dict()}), 201


@api_media_bp.route("/media/batch", methods=["POST"])
def batch_upload():
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files provided"}), 400

    results = []
    errors = []
    for f in files:
        if not f or not f.filename:
            continue
        if not allowed_file(f.content_type or ""):
            errors.append({"filename": f.filename, "error": f"Type {f.content_type} not allowed"})
            continue
        try:
            metadata = process_upload(f)
            media = Media(
                original_filename=metadata["original_filename"],
                stored_filename=metadata["stored_filename"],
                file_path=metadata["file_path"],
                thumbnail_path=metadata.get("thumbnail_path"),
                file_size=metadata["file_size"],
                mime_type=metadata["mime_type"],
                width=metadata["width"],
                height=metadata["height"],
            )
            db.session.add(media)
            db.session.flush()
            results.append(media.to_dict())
        except Exception as e:
            errors.append({"filename": f.filename, "error": str(e)})

    db.session.commit()
    return jsonify({"media": results, "errors": errors}), 201


@api_media_bp.route("/media/<int:media_id>", methods=["GET"])
def get_media(media_id):
    media = Media.query.get_or_404(media_id)
    return jsonify({"media": media.to_dict()})


@api_media_bp.route("/media/<int:media_id>", methods=["PUT"])
def update_media(media_id):
    media = Media.query.get_or_404(media_id)
    data = request.get_json(silent=True) or {}
    if "alt_text" in data:
        media.alt_text = data["alt_text"]
    if "original_filename" in data:
        media.original_filename = data["original_filename"]
    db.session.commit()
    return jsonify({"media": media.to_dict()})


@api_media_bp.route("/media/<int:media_id>", methods=["DELETE"])
def delete_media(media_id):
    media = Media.query.get_or_404(media_id)

    # Check references
    used_in_works = WorkImage.query.filter_by(media_id=media_id).count()
    used_as_cover = Work.query.filter_by(cover_media_id=media_id).count()

    if used_in_works or used_as_cover:
        refs = []
        if used_in_works:
            refs.append(f"{used_in_works} gallery entries")
        if used_as_cover:
            refs.append(f"{used_as_cover} cover images")
        return jsonify({
            "error": f"Media is referenced by {' and '.join(refs)}. Remove those references first.",
            "references": {"gallery": used_in_works, "cover": used_as_cover},
        }), 409

    delete_upload(media.file_path, media.thumbnail_path)
    db.session.delete(media)
    db.session.commit()
    return jsonify({"ok": True})
