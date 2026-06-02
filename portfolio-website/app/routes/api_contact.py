"""Public contact form submission route with optional email notification."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify
from app.models import SiteConfig

api_contact_bp = Blueprint("api_contact", __name__)


def send_contact_notification(name, email, message):
    """Try to send email notification. Silently handle failures."""
    config = SiteConfig.get_all()
    if config.get("email_notification_enabled") != "true":
        return

    host = config.get("smtp_host", "")
    port = int(config.get("smtp_port", "587"))
    use_tls = config.get("smtp_use_tls", "true") == "true"
    username = config.get("smtp_username", "")
    password = config.get("smtp_password", "")
    to_email = config.get("notification_email", "")

    if not host or not username or not password or not to_email:
        print("SMTP not fully configured; skipping email notification.")
        return

    try:
        msg = MIMEMultipart()
        msg["From"] = username
        msg["To"] = to_email
        msg["Subject"] = f"New Contact Form Message from {name}"

        body = f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}"
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP(host, port, timeout=15) as server:
            if use_tls:
                server.starttls()
            server.login(username, password)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send notification email: {e}")


@api_contact_bp.route("/contact", methods=["POST"])
def submit_contact():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message", "").strip()

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not message:
        return jsonify({"error": "Message is required"}), 400

    # Basic email validation
    import re
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return jsonify({"error": "Invalid email address"}), 400

    # Send notification (non-blocking would be better, but smtplib is fast enough
    # for a small portfolio site)
    send_contact_notification(name, email, message)

    return jsonify({"ok": True, "message": "Thank you! Your message has been sent."})
