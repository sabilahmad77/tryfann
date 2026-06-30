"""
Standalone PRODUCTION settings for Trifan (api.trifan.com).

Self-contained product — NOT merged with FANN, NOT pointing at any FANN prod
backend. Inherits the trimmed app/URL surface from settings_local, then makes
everything env-driven with safe defaults so the service boots for staging
WITHOUT real secrets. Real SECRET_KEY / Postgres / Redis / SMTP are supplied
via environment in the approved next phase.

Run with:  DJANGO_SETTINGS_MODULE=core.settings_production
"""
import os

from .settings_local import *  # noqa: F401,F403  (trimmed apps, urls, celery/channel)
from .settings import BASE_DIR  # noqa: F401


def _env(key, default=None):
    return os.environ.get(key, default)


def _env_bool(key, default=False):
    v = os.environ.get(key)
    return default if v is None else v.strip().lower() in ("1", "true", "yes", "on")


def _env_list(key, default):
    v = os.environ.get(key)
    return [x.strip() for x in v.split(",") if x.strip()] if v else list(default)


# --- Core ---
DEBUG = _env_bool("DJANGO_DEBUG", False)
# SECRET_KEY: env in prod; inherits the dev key only for unconfigured staging.
SECRET_KEY = _env("DJANGO_SECRET_KEY", SECRET_KEY)  # noqa: F405
ALLOWED_HOSTS = _env_list(
    "DJANGO_ALLOWED_HOSTS", ["api.trifan.com", "localhost", "127.0.0.1"]
)

# --- Database: Postgres via DATABASE_URL when provided (next phase); else the
# inherited SQLite so the service still boots for staging/readiness. ---
_db_url = _env("DATABASE_URL")
if _db_url:
    import dj_database_url

    DATABASES = {  # noqa: F405
        "default": dj_database_url.parse(_db_url, conn_max_age=600, ssl_require=True)
    }

# --- Static files via WhiteNoise (no separate static host needed) ---
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}
_mw = list(MIDDLEWARE)  # noqa: F405
if "whitenoise.middleware.WhiteNoiseMiddleware" not in _mw:
    try:
        _i = _mw.index("django.middleware.security.SecurityMiddleware") + 1
    except ValueError:
        _i = 0
    _mw.insert(_i, "whitenoise.middleware.WhiteNoiseMiddleware")
MIDDLEWARE = _mw

# --- CORS / CSRF locked to the Trifan frontend (no allow-all in prod) ---
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = _env_list(
    "CORS_ALLOWED_ORIGINS", ["https://trifan.com", "https://www.trifan.com"]
)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = _env_list(
    "CSRF_TRUSTED_ORIGINS",
    ["https://trifan.com", "https://www.trifan.com", "https://api.trifan.com"],
)

# Verification/email links point at the real frontend.
FRONTEND_BASE_URL = _env("FRONTEND_BASE_URL", "https://trifan.com")

# --- Email: real SMTP only when creds are present (next phase); console else ---
if _env("EMAIL_HOST_USER") and _env("EMAIL_HOST_PASSWORD"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = _env("EMAIL_HOST", "sandbox.smtp.mailtrap.io")
    EMAIL_PORT = int(_env("EMAIL_PORT", "2525"))
    EMAIL_HOST_USER = _env("EMAIL_HOST_USER")
    EMAIL_HOST_PASSWORD = _env("EMAIL_HOST_PASSWORD")
    EMAIL_USE_TLS = _env_bool("EMAIL_USE_TLS", True)
    DEFAULT_FROM_EMAIL = _env("DEFAULT_FROM_EMAIL", "Trifan <no-reply@trifan.com>")
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# --- Strict anti-fraud throttles in production (override the relaxed local) ---
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_THROTTLE_RATES": {
        **REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {}),  # noqa: F405
        "register": _env("THROTTLE_REGISTER", "10/hour"),
        "refer": _env("THROTTLE_REFER", "30/hour"),
    },
}

# --- Behind a TLS-terminating proxy (Render / Railway / Fly / Koyeb) ---
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
# Hardening that only bites when DEBUG is off; harmless on staging.
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
