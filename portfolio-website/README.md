# Portfolio Website with CMS

A complete art/design portfolio website with a built-in CMS admin panel.

## Features

### Frontend
- **Home** — Full-screen hero with configurable background, featured works carousel
- **Portfolio** — Grid layout with category filters, search, infinite scroll
- **Work Detail** — Image slider/gallery, video player, share buttons, related works
- **About** — Profile section with photo, bio, philosophy, exhibitions timeline
- **Contact** — Contact form with email notification, social media links
- **Global** — Responsive design, dark/light mode, glassmorphism nav, scroll animations, parallax effects

### Admin Panel (CMS)
- **Dashboard** — Overview stats (works, media, categories)
- **Works Management** — CRUD with search, filter, sort; publish/unpublish; gallery images; videos
- **Media Library** — Upload, batch upload, preview grid, delete with reference check
- **Profile Editor** — Hero config, profile, exhibitions timeline, social links
- **Settings** — Password change, site config, SMTP/email settings
- **Live Preview** — Preview frontend with mobile/tablet/desktop device frames

## Quick Start

### Prerequisites
- Python 3.9+
- pip

### Installation

```bash
# Clone / navigate to the project
cd portfolio-website

# Install dependencies
pip install -r requirements.txt

# Copy environment config (optional)
cp .env.example .env

# Start the server
python run.py
```

Open http://localhost:5000 in your browser.

### Admin Panel

Go to http://localhost:5000/admin

Default login:
- **Username**: `admin`
- **Password**: `admin123`

**Change the password immediately** via the Settings page.

## Configuration

Edit `.env` to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask session encryption key | `dev-secret-...` |
| `DATABASE_URL` | SQLite database path | `sqlite:///data/portfolio.db` |
| `SMTP_HOST` | SMTP server for contact notifications | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP username | — |
| `SMTP_PASSWORD` | SMTP password | — |
| `NOTIFICATION_EMAIL` | Where to send contact form messages | — |

## Project Structure

```
portfolio-website/
├── run.py                  # Entry point
├── app/                    # Flask backend
│   ├── models.py           # Database models
│   ├── routes/             # API endpoints
│   └── utils.py            # Image processing, file upload
├── static/
│   ├── frontend/           # Public website
│   │   ├── css/            # Stylesheets
│   │   └── js/             # JavaScript (ES6 modules)
│   └── admin/              # Admin panel
│       ├── css/admin.css
│       └── js/             # Admin JavaScript
├── templates/              # HTML shells
│   ├── frontend.html
│   └── admin.html
└── uploads/                # User uploads (images, thumbnails)
```

## Tech Stack

- **Backend**: Flask 3.x + SQLAlchemy + SQLite
- **Frontend**: Vanilla HTML/CSS/JS (ES6 modules, no build step)
- **Auth**: Flask server-side sessions
- **Image Processing**: Pillow (resize + thumbnail generation)
- **Email**: smtplib (stdlib)

## Deployment

This project is designed to work with any WSGI server:

```bash
# Using gunicorn (Linux/Mac)
gunicorn run:app

# Using waitress (Windows)
pip install waitress
python -c "from run import app; from waitress import serve; serve(app, port=5000)"
```

Or deploy to Render.com — just point the build command to `pip install -r requirements.txt` and start command to `python run.py`.
