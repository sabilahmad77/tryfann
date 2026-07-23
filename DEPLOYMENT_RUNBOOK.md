# TryFANN — Deployment Runbook

Production topology: **frontend** = Vite SPA on **Vercel** (`www.tryfann.com`,
`tryfann.com`); **backend** = Django/DRF on **Render** (`api.tryfann.com`);
**DB** = Render Postgres; **email** = Resend (HTTPS). Pushing `main` to GitHub
auto-deploys the Vercel frontend. Render deploys are triggered manually (no
GitHub App/webhook wired).

Production URLconf is the trimmed `core.urls_local` (only `/api/market_final/`
+ `/api/qualification/` + `/health` + `/admin/`). The `users` app is NOT mounted
in prod.

---

## 0. Pre-flight (verified before this deploy)
- Backend test suite: **71 passing** (`manage.py test fann.qualification.tests`).
- `tsc --noEmit` clean; `vite build` clean; `manage.py check` clean;
  `manage.py makemigrations --check` → "No changes detected".
- Migrations present + ordered, incl. `users/0057_acquisition_source`,
  `qualification/0009_consentrecord`, `qualification/0010_whitelistentry_application_status_and_more`,
  `users/0058_intersetreward_buying_frequency_and_more`. All apply cleanly on a fresh DB.
- Local 6-role HTTP smoke passed (register/login/me + founding/status +
  collector prefs round-trip + erasure confirm gate).

---

## 1. Environment variable inventory

### Render (backend) — set in the service's Environment tab
| Var | Req? | Purpose |
|-----|------|---------|
| `DJANGO_SETTINGS_MODULE` | required | `core.settings_production` |
| `DJANGO_DEBUG` | required | `false` |
| `DJANGO_SECRET_KEY` | required | 50+ char random (Render can generate) |
| `DJANGO_ALLOWED_HOSTS` | required | `api.tryfann.com` |
| `DATABASE_URL` | required | Render Postgres URL (else ephemeral SQLite) |
| `CORS_ALLOWED_ORIGINS` | required | `https://tryfann.com,https://www.tryfann.com` |
| `CSRF_TRUSTED_ORIGINS` | required | `…,https://api.tryfann.com` |
| `FRONTEND_BASE_URL` | required | `https://www.tryfann.com` (email links) |
| `RESEND_API_KEY` | required | transactional email over HTTPS |
| `DEFAULT_FROM_EMAIL` | optional | `TryFANN <no-reply@tryfann.com>` |
| `GOOGLE_OAUTH_CLIENT_ID` | optional | must match frontend `VITE_GOOGLE_CLIENT_ID`; empty → Google verify 400s |
| `AWS_STORAGE_BUCKET_NAME` (+`AWS_ACCESS_KEY_ID`,`AWS_SECRET_ACCESS_KEY`,`AWS_S3_REGION_NAME`,`AWS_S3_ENDPOINT_URL`) | optional | private encrypted KYC media on S3/R2. **Blank → uploads use Render's EPHEMERAL local disk (lost on redeploy).** |
| `THROTTLE_REGISTER` / `THROTTLE_REFER` | optional | anti-fraud rates (defaults 10/hour, 30/hour) |

### Vercel (frontend) — Project → Settings → Environment Variables (build-time, PUBLIC)
| Var | Req? | Purpose |
|-----|------|---------|
| `VITE_API_BASE_URL` | required | `https://api.tryfann.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | optional | Google Web client id; empty → button hidden |
| `VITE_GA_MEASUREMENT_ID` | optional | GA4 id; empty → GA mirror off (server funnel still records) |

Full templates: `backend/.envexample`, `frontend/.env.example`.

---

## 2. Ordered deploy (sequenced to minimise frontend↔backend skew)

All Stage-5 backend changes are **additive** (new endpoints + new nullable
columns/tables), so a brief skew is graceful: a new frontend hitting an old
backend gets 404s that render as ErrorState/empty, never a crash; an old
frontend never calls the new endpoints. Still, keep the window small:

1. **Push** `main` → GitHub. This immediately kicks off the **Vercel** frontend build.
2. **Immediately** trigger the **Render** deploy of the same commit (Render →
   `tryfann-api` → *Manual Deploy → Deploy latest commit*) so backend builds in parallel.
   - Migrations run in the Render **build** (`render.yaml` buildCommand now includes
     `migrate --noinput`). If this service's build command is set in the dashboard
     instead, either add `migrate` there or run step 3.
3. **Post-deploy, in the Render Shell** (only if migrations did not run in build):
   ```
   python manage.py migrate --noinput
   ```
4. **Demo/harness purge** (item H) — in the Render Shell, dry-run first, then execute:
   ```
   python manage.py purge_demo_accounts            # dry-run (default)
   python manage.py purge_demo_accounts --execute
   ```
5. Confirm both dashboards show the deploy on the **same commit hash**.

---

## 3. Post-deploy live smoke test (see PROD-CHECK.sh helper below)
- `GET https://api.tryfann.com/health` → 200.
- `GET https://api.tryfann.com/api/qualification/founding/status` → 200 JSON, 4 tiers.
- `https://www.tryfann.com` loads; no console errors; Google button renders.
- Register a throwaway account → verification email arrives at a real inbox.
- Log in each role (Artist, Collector, Gallery, Ambassador, Curator, admin,
  superuser) → correct dashboard + access.
- Collector → Collecting Preferences → save → admin `collector-segments` shows it.
- Settings → Delete account → confirm → session cleared (throwaway account only).
- Admin → applicants shows **0** demo/harness accounts.
- `POST /api/market_final/reward` with junk → typed 400 (not raw 500);
  empty KYC POST → 400.

---

## 4. Rollback plan
- **Frontend (Vercel):** Deployments → pick the previous green deployment →
  *Promote to Production* (instant; static assets).
- **Backend (Render):** Deploys → previous successful deploy → *Rollback*.
  - Migrations are additive + backward-compatible, so rolling back the code does
    NOT require rolling back the DB (old code ignores the new columns/tables).
    Do **not** reverse-migrate on rollback.
- **Env mistake:** fix the var in the dashboard → redeploy (Vercel needs a
  rebuild for `VITE_*` changes; Render restarts for backend vars).
- **Bad data from purge:** the purge is a **soft** delete (`is_active=False`,
  `is_deleted=True`), reversible by flipping those flags on the affected rows;
  it never hard-deletes.

---

## 5. Deferred (post-launch backlog — NOT part of this deploy)
- P2 growth: collector-segmentation admin UI + CRM export, curator-invitation
  admin console + accept page, founding-cap/waitlist-status admin console,
  trust-education content, re-engagement, dashboards.
- P3 hardening: tokens → httpOnly cookie, SPA SEO/SSR, WCAG 2.2 AA, performance
  budget, CI/CD, secret rotation, EN/AR QA at scale.
- Legal copy stays as counsel placeholders (item G).
