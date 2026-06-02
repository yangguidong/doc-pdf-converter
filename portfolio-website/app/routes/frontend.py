"""Frontend SPA shell routes."""

from flask import Blueprint, render_template

frontend_bp = Blueprint("frontend", __name__)


@frontend_bp.route("/")
def index():
    return render_template("frontend.html")


@frontend_bp.route("/preview")
def preview():
    """Used by admin iframe for live preview."""
    return render_template("frontend.html")
