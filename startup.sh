#!/bin/bash
# Install LibreOffice for perfect Word→PDF conversion (optional, app works without it)
apt-get update -qq && apt-get install -y -qq libreoffice-core libreoffice-writer 2>/dev/null || true
# Start the Flask server
exec python server.py
