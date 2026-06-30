FROM python:3.12-slim

# System prep
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# OS deps needed by common Python wheels (psycopg2, pillow, etc.) + cron
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    gcc \
    build-essential \
    libpq-dev \
    cron \
 && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# Install Python deps first for better layer caching

# Install Python deps first for better layer caching
COPY requirements/requirements.txt .
RUN pip install -r requirements.txt


# Copy project
COPY . .

# Entrypoint handles waiting for DB, collectstatic, migrate, add crontab, start cron, then Daphne
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]
