# TryFANN — standalone

Pre-launch lead-qualification platform. **Standalone product** — not connected to,
or dependent on, any other backend.

## Structure (monorepo)
- `frontend/` — Vite + React + TypeScript SPA → deploys to **Vercel** (`tryfann.com`).
- `backend/`  — Django + DRF API (SQLite now, Postgres in prod) → deploys to a
  Python host, e.g. **Render** (`api.tryfann.com`).

## Run locally
Backend:  `cd backend && python manage.py runserver`  (DJANGO_SETTINGS_MODULE=core.settings_local)
Frontend: `cd frontend && npm install && npm run dev`   (proxies /api → :8000)

## Deploy
See `DEPLOYMENT.md` at the repo root for the full checklist, env vars, and DNS records.
- Frontend: Vercel, root dir `frontend/`, env `VITE_API_BASE_URL=https://api.tryfann.com/api`.
- Backend: Render blueprint `backend/render.yaml`, settings `core.settings_production`.
