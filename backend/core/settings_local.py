"""
Local-only settings for running the TryFann lead-qualification funnel.

NOT for production. NOT pushed. Imports the real settings and overrides only
what's needed to boot the `market_final` API on SQLite without the prod
infra (Postgres / Redis / Celery worker / Channels) or the ML+web3 apps.

Run with:  DJANGO_SETTINGS_MODULE=core.settings_local
"""
import os

from .settings import *  # noqa: F401,F403  (inherit everything, then override)
from .settings import BASE_DIR

# --- Core ---
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# --- SQLite instead of Postgres ---
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
    }
}

# --- Trim apps to the funnel surface ---
# Dropped vs prod: daphne (ASGI server), channels / channels_redis (websockets),
# django_crontab, and the apps that pull torch/tf (analysisai) or web3
# (buyer / artist) or aren't needed for the funnel (chat). `channels` stays
# pip-installed so notifications.tasks can import get_channel_layer, but it is
# NOT an installed app, so runserver uses plain WSGI and core/asgi.py (which
# imports chat/notifications websocket routing) is never loaded.
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_extensions",
    "fann.users.apps.UsersConfig",
    "fann.notifications.apps.NotificationsConfig",
    "fann.market_final.apps.MarketFinalConfig",
    "fann.qualification.apps.QualificationConfig",
]

# --- Local URLconf: admin + market_final only (keeps web3/torch out of the import graph) ---
ROOT_URLCONF = "core.urls_local"

# --- Run any Celery tasks (fired from signals) in-process; never fatal ---
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = False

# --- In-memory channel layer (no Redis); harmless if unused ---
CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# --- Email to console (no SMTP) ---
# Kept on console locally: real send is blocked until a verified Mailtrap
# sending domain is configured (see core/settings.py EMAIL_*). To send real
# verification emails locally, comment the next line (inherits the SMTP backend
# from core.settings) once the from-domain is verified in Mailtrap.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Verification/email links point to the local frontend in dev
FRONTEND_BASE_URL = "http://localhost:3000"

# --- Permissive CORS for the local Vite frontend (http://localhost:3000) ---
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# --- Rate limits for /register and /refer (DRF ScopedRateThrottle on those views) ---
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405  (inherited from core.settings)
    "DEFAULT_THROTTLE_RATES": {
        **REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}),  # noqa: F405
        # Local-dev only: relaxed so repeated manual testing from one IP isn't
        # blocked. Production (core/settings.py) keeps the strict anti-fraud
        # value (10/hour register, 30/hour refer); the limit itself is proven.
        "register": "60/hour",
        "refer": "60/hour",
    },
}
