# Local TryFann backend (SQLite) — local-only, never pushed

This branch (`local/tryfann-qualification`) runs the **`market_final` lead-
qualification funnel** of the FANN Django backend on **SQLite**, with none of
the production infra (Postgres / Redis / Celery worker / Channels) and none of
the heavy ML / blockchain apps (torch, tensorflow, faiss, opencv, catboost,
web3). It exists so the local TryFann frontend has a working API while the
live `api.fann.art` is down — it is **not** a production artifact.

> The production GitHub remote and the live server are untouched. The push URL
> on this clone has been disabled (`git remote -v` shows `DISABLED_no_push_local_only`).

## What was added (all local-only)

| File | Purpose |
|------|---------|
| `core/settings_local.py` | Inherits `core.settings`, overrides to SQLite + trimmed `INSTALLED_APPS` + in-memory channel layer + console email + eager Celery + permissive CORS. |
| `core/urls_local.py` | `admin/` + `api/market_final/` only — keeps web3/torch view modules out of the import graph. |
| `run-local.sh` | Boots the server with `DJANGO_SETTINGS_MODULE=core.settings_local`. |
| `requirements-local-tryfann.txt` | The light dependency set (no torch/web3). |
| `fann/market_final/serializers.py` | Removed a dead `from matplotlib.pyplot import title` import (only tracked-file change). |

## Run it

```bash
cd fann
python3 -m venv venv                 # first time
./venv/bin/pip install -r requirements-local-tryfann.txt   # first time
DJANGO_SETTINGS_MODULE=core.settings_local ./venv/bin/python manage.py migrate  # first time
bash run-local.sh                    # serves http://127.0.0.1:8000
```

The frontend points at it via `tryfann/.env.local`
(`VITE_API_BASE_URL=http://localhost:8000/api`).

## Notes

- Registration sets `is_verify=False`; login requires a verified account. For
  local testing, flip it: `manage.py shell -c "from fann.users.models import User; u=User.objects.get(email='...'); u.is_verify=True; u.save()"`.
- `db.sqlite3`, `venv/`, `staticfiles/` are git-ignored locally (`.git/info/exclude`).
- The `progression` tiers returned here are the **old** point tiers
  (Explorer / Curator / Patron / Ambassador / Founding Patron). Renaming these
  to the §5.4 whitelist ladder (Waitlisted → Verified Member → Priority Access →
  Founder's Circle) is the upcoming qualification-engine work.
