# TryFANN — Deployment (standalone)

Standalone product. **Not** merged with FANN, **not** dependent on any FANN backend/repo.

- Frontend (`frontend/`) → **Vercel** → `tryfann.com`
- Backend (`backend/`) → **Render** (recommended) → `api.tryfann.com`

---

## Repo structure — Option A: monorepo (recommended)
```
tryfann/
├── frontend/   # Vite + React + TS  → Vercel (Root Directory: frontend)
├── backend/    # Django + DRF        → Render (Root Directory: backend)
├── README.md
└── DEPLOYMENT.md
```
Why A over branches/two-repos: one source of truth, atomic FE+BE commits, each host points at its own subfolder, simplest to operate. (Branches can't co-exist checked out; two repos double the CI/secrets/sync overhead.)

---

## Hosting recommendation (backend)
Priorities: cheapest → easiest → stable → custom domain → easy GitHub updates. (Confirm current pricing — tiers change.)

| Host | Free tier | Paid (always-on) | Django | Custom domain | GitHub deploy | Notes |
|---|---|---|---|---|---|---|
| **Render** ✅ | Web free (sleeps ~15 min idle, cold start ~30s); Postgres free 90 days | Web **$7/mo**, Postgres **$7/mo** | Native, `render.yaml` ready | Yes, free TLS | Auto-deploy on push | Best DX; blueprint already in `backend/render.yaml` |
| Railway | Trial credit only | **~$5/mo** Hobby (usage) | Native (Nixpacks/Procfile) | Yes | Yes | No cold starts on cheap tier; usage can creep |
| Fly.io | Small pay-as-you-go | ~$5/mo (256MB) | Docker-based | Yes | via GH Actions | More setup (Docker, fly.toml) |
| Koyeb | 1 free nano service | ~$0–7 | Buildpack/Docker | Yes | Yes | Smaller ecosystem |

**Recommendation:** **Render.**
- **Staging now: $0** (free web service — fine for pre-launch/low traffic).
- **Production: ~$7/mo** web (always-on) + Postgres (free 90-day, or $7/mo managed) → **$7–14/mo**, within your ≤$15 budget.
- Runner-up: **Railway** (~$5/mo, no cold starts) if you dislike Render's free-tier sleep.

---

## Frontend → Vercel
1. Import the repo, set **Root Directory = `frontend`**.
2. Framework preset: Vite (auto). Build `vite build`, output `dist` (also in `frontend/vercel.json`, which adds SPA rewrites).
3. Env var: `VITE_API_BASE_URL = https://api.tryfann.com/api`
4. Add domain `tryfann.com` (+ `www`).

## Backend → Render
1. New → Blueprint → pick the repo (uses `backend/render.yaml`), or New Web Service with **Root Directory = `backend`**.
2. Build: `pip install -r requirements-production.txt && python manage.py collectstatic --noinput`
3. Start: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120`
4. Health check path: `/health`
5. Env vars (blueprint sets most): `DJANGO_SETTINGS_MODULE=core.settings_production`, `DJANGO_DEBUG=false`, `DJANGO_SECRET_KEY` (generate), `DJANGO_ALLOWED_HOSTS=api.tryfann.com`, `CORS_ALLOWED_ORIGINS=https://tryfann.com,https://www.tryfann.com`, `CSRF_TRUSTED_ORIGINS=https://tryfann.com,https://www.tryfann.com,https://api.tryfann.com`, `FRONTEND_BASE_URL=https://www.tryfann.com`.
6. Add domain `api.tryfann.com`.

> Boots on SQLite with safe defaults today (staging). `DATABASE_URL`, `EMAIL_*`, Redis are **next phase** (your approval).

## DNS records (at your domain registrar)
| Type | Name | Value |
|---|---|---|
| A / CNAME | `tryfann.com` (+ `www`) | Vercel target (shown in Vercel domain settings) |
| CNAME | `api` | Render service target (shown in Render domain settings) |

---

## Verified this phase (locally, like a real user)
- Backend prod path: `gunicorn` + `core.settings_production` → `/health` 200, login 200, `collectstatic` OK (WhiteNoise).
- Frontend prod build: `vite build` ✓; `api.tryfann.com` baked in; **no** `localhost`/`api.fann.art` leaks.
- Production build in browser: signin → login → CORS → gunicorn prod backend → dashboard (Priority Access, 73/100 real data).
- Deep-route refresh `/dashboard`, `/admin` → 200 (SPA fallback) — no 404 on reload.
- Mobile 375px layout usable.
- Standalone repo assembled, fresh git, 594 files, no old `AspireX24` remote, no secrets/heavy tracked.

## Blockers — needs you (one at a time)
1. **GitHub**: authorize me / confirm to create repo `tryfann` and push (repo is staged locally at `~/Downloads/trifan`).
2. **Vercel**: log in / authorize to import the repo + add `tryfann.com`.
3. **Render** (or chosen host): log in / authorize to deploy `backend/` + add `api.tryfann.com`.
4. **DNS**: access to the `tryfann.com` registrar to add the A/CNAME records above.

## NOT in this phase (await your approval — next phase)
Real `DJANGO_SECRET_KEY` rotation, **Postgres** (`DATABASE_URL` + migrate), **Redis** (shared throttle/cache), real **email provider** (verified sending domain), **S3/R2** for media (KYC docs/images), payment keys, remove demo/QA accounts, full security hardening + CI/CD.
