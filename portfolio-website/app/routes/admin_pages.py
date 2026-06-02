"""Admin panel SPA shell route."""

from flask import Blueprint, render_template

admin_pages_bp = Blueprint("admin_pages", __name__)


@admin_pages_bp.route("/admin")
@admin_pages_bp.route("/admin/")
def admin_index():
    return render_template("admin.html")
