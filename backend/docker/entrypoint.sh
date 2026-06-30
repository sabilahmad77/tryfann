#!/bin/sh
set -euo pipefail

# Defaults (can be overridden via env/.env)
: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"
: "${DB_NAME:?DB_NAME not set}"
: "${DB_USER:?DB_USER not set}"
: "${DB_PASSWORD:?DB_PASSWORD not set}"

# Helpful defaults for Python logs & TF noise
export PYTHONUNBUFFERED=${PYTHONUNBUFFERED:-1}
export PYTHONDONTWRITEBYTECODE=${PYTHONDONTWRITEBYTECODE:-1}
export TF_CPP_MIN_LOG_LEVEL=${TF_CPP_MIN_LOG_LEVEL:-2}

echo "Ensuring media/static directories exist…"
mkdir -p /app/media /app/staticfiles

echo "Waiting for Postgres at ${DB_HOST}:${DB_PORT}…"
python - <<'PY'
import os, time, sys
try:
    import psycopg2
except Exception as e:
    print("ERROR: psycopg2 is required in the image. Install it in requirements.txt.", file=sys.stderr)
    sys.exit(1)

host=os.environ["DB_HOST"]
port=int(os.environ["DB_PORT"])
user=os.environ["DB_USER"]
password=os.environ["DB_PASSWORD"]
dbname=os.environ["DB_NAME"]

for i in range(90):
    try:
        conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname=dbname)
        conn.close()
        print("Postgres is up.")
        break
    except Exception as e:
        print(f"  retry {i+1}/90: {e}")
        time.sleep(2)
else:
    print("Postgres not reachable, giving up.", file=sys.stderr)
    sys.exit(1)
PY

echo "Running Django system checks…"
python manage.py check

echo "Collecting static files…"
python manage.py collectstatic --noinput

echo "Applying database migrations…"
python manage.py migrate --noinput

echo "Applying CRONS"
python manage.py crontab add

echo "Starting cron daemon…"
# ensure a log file exists (optional)
touch /var/log/cron.log || true
# start cron in background (Debian/Ubuntu: 'cron')
cron

echo "Starting ASGI server: $*"
exec "$@"
