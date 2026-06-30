#!/usr/bin/env bash
# Local-only TryFann backend: the market_final funnel on SQLite, no Postgres/
# Redis/Celery-worker/Channels and no torch/web3. NOT for production. Never pushed.
# Uses core.settings_local + core.urls_local. See requirements-local-tryfann.txt.
set -euo pipefail
cd "$(dirname "$0")"
export DJANGO_SETTINGS_MODULE=core.settings_local
exec ./venv/bin/python manage.py runserver "${1:-127.0.0.1:8000}" --noreload
