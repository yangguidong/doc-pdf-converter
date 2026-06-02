"""Register all route blueprints with the Flask app."""


def register_blueprints(app):
    from app.routes.frontend import frontend_bp
    from app.routes.admin_pages import admin_pages_bp
    from app.routes.api_public import api_public_bp
    from app.routes.api_auth import api_auth_bp
    from app.routes.api_works import api_works_bp
    from app.routes.api_media import api_media_bp
    from app.routes.api_profile import api_profile_bp
    from app.routes.api_site_config import api_site_config_bp
    from app.routes.api_contact import api_contact_bp

    app.register_blueprint(frontend_bp)
    app.register_blueprint(admin_pages_bp)
    app.register_blueprint(api_public_bp, url_prefix="/api")
    app.register_blueprint(api_auth_bp, url_prefix="/api/admin")
    app.register_blueprint(api_works_bp, url_prefix="/api/admin")
    app.register_blueprint(api_media_bp, url_prefix="/api/admin")
    app.register_blueprint(api_profile_bp, url_prefix="/api/admin")
    app.register_blueprint(api_site_config_bp, url_prefix="/api/admin")
    app.register_blueprint(api_contact_bp, url_prefix="/api")
