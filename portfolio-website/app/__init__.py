"""Flask application factory for the portfolio website."""

from flask import Flask
from app.config import Config
from app.database import db, init_db
from app.auth import seed_admin_user


def create_app(config_class=Config):
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static",
    )
    app.config.from_object(config_class)

    # Ensure data directory exists
    import os
    from pathlib import Path

    data_dir = Path(app.config.get("SQLALCHEMY_DATABASE_URI", "").replace("sqlite:///", ""))
    if not data_dir.is_absolute():
        data_dir = Path(__file__).resolve().parent.parent / data_dir
    data_dir.parent.mkdir(parents=True, exist_ok=True)

    # Init database
    init_db(app)

    # Serve uploaded files
    from flask import send_from_directory
    upload_dir = Path(app.config["UPLOAD_FOLDER"])
    if not upload_dir.is_absolute():
        upload_dir = Path(__file__).resolve().parent.parent / upload_dir

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(str(upload_dir), filename)

    # Register blueprints
    from app.routes import register_blueprints
    register_blueprints(app)

    # Seed defaults
    with app.app_context():
        seed_admin_user()
        from app.models import HeroConfig, Profile, SiteConfig
        HeroConfig.get()
        Profile.get()
        SiteConfig.seed_defaults()
        db.session.commit()

    return app
