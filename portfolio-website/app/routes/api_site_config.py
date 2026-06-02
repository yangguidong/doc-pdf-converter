"""Admin API for site configuration."""

from flask import Blueprint, request, jsonify
from app.database import db
from app.models import SiteConfig

api_site_config_bp = Blueprint("api_site_config", __name__)


@api_site_config_bp.route("/site-config", methods=["GET"])
def get_config():
    return jsonify(SiteConfig.get_all())


@api_site_config_bp.route("/site-config", methods=["PUT"])
def update_config():
    data = request.get_json(silent=True) or {}
    SiteConfig.set_many(data)
    db.session.commit()
    return jsonify(SiteConfig.get_all())
