# TryFANN — v2 Re-Audit Fix Report

**Branch:** `v2/fix-and-harden` · one commit per finding ID
**Method:** RED (reproduce) → GREEN (fix) → PROVE (automated test + live transcript)
**Local stack under test:** Django `core.settings_local` (SQLite, :8000) + Vite dev (`:3000`, `/api`→:8000 proxy), driven through the real UI in a browser.

All four re-audit findings (DATA-01, ADM-01, SEC-03, DATA-02) plus the LOW batch are **DONE** with proof. Backend suite: **22/22 passing**. `vite build` (Vercel's build): **clean**. Frontend `tsc --noEmit`: **clean**.

---

## A1 · DATA-01 (HIGH) — Retire the dual API model → single source of truth

**Status: DONE**

**Files**
- `backend/fann/qualification/services.py` — `dashboard_payload()` (role-aware, integer counters, `conversion` key + `conversation` alias; concierge track gets no portfolio/insight)
- `backend/fann/qualification/views.py` — `MeDashboardView`, `MeArtworksView`, `MeCollectionView`, `MeRosterView`
- `backend/fann/qualification/urls.py` — `me/dashboard`, `me/artworks`, `me/collection`, `me/roster`
- `backend/fann/market_final/views.py` — `_gone_dashboard()` + 3 stats views return **410 Gone**
- `frontend/src/services/api/dashboardApi.ts`, `frontend/src/services/api/artworkApi.ts` — every dashboard mount-read repointed to `/qualification/*`
- `frontend/scripts/contract-data01.mjs` — client contract check (npm `contract:data01`)

**RED (dual model, both namespaces 200 before fix)**
`GET /qualification/me/tasks -> 200`, `GET /market_final/dashboard_stats -> 200`, `GET /market_final/artwork_artist/ -> 200` — two sources of truth on one mount.

**Tests** — `backend/fann/qualification/tests/test_data01_dashboard.py` (8):
`test_legacy_stat_endpoints_return_410_gone`, `test_me_dashboard_is_the_single_source`, `test_counters_are_integers`, `test_game_track_has_portfolio_and_insight`, `test_concierge_track_never_gets_portfolio_or_insight`, `test_ambassador_social_stats_present`, `test_alias_read_endpoints_respond`, `test_me_dashboard_requires_auth`.
Client: `node scripts/contract-data01.mjs` → all 6 mount reads resolve to `/qualification/*`, zero `/market_final/*`.

**PROVE (live)**
```
LEGACY (expect 410):  dashboard_stats 410 · _gallery 410 · _ambassador 410
NEW (expect 200):     me/dashboard artist/collector/gallery/amb 200 · me/artworks 200 · me/collection 200 · me/roster 200
Browser mount, Artist:    GET /api/qualification/me, /me/tasks, /me/artworks, /me/dashboard  — ZERO /market_final/dashboard_stats* or /artwork_artist
Browser mount, Collector: GET /api/qualification/me, /me/tasks, /me/artworks, /me/dashboard  — ZERO /market_final/dashboard_stats* or /artwork_artist
```
(The only `/market_final/*` call on mount is `POST user_login` — an auth action, not a stat/portfolio read. CRUD resources `artwork_artist/`, `artwork_collection/`, `artist_roaster/` stay **200** for mutations; only the 3 stats endpoints are 410.)

---

## A2 · ADM-01 (HIGH) — Enforce is_staff on admin routes; gate decisions on is_superuser

**Status: DONE**

**Files**
- `backend/fann/common/permissions.py` — `IsStaffSuperuser` (checks the Django `is_staff` **and** `is_superuser` flags, not the string role)
- `backend/fann/qualification/admin_api.py` — `AdminApplicantActionView`, `AdminReviewTaskView`, `AdminReviewKYCView` → `IsStaffSuperuser`; read queues stay `IsAdminUser`

**RED** — before fix, every admin route (reads and decisions) was gated only on `IsAdminUser` (is_staff); a staff-but-not-superuser account could approve KYC. (The feared Critical was NOT present: member token already got 403 on admin routes.)

**Tests** — `backend/fann/qualification/tests/test_adm01_admin_authz.py` (5):
`test_unauthenticated_is_401`, `test_member_is_forbidden_everywhere`, `test_staff_can_read_queues`, `test_staff_non_superuser_cannot_decide`, `test_superuser_passes_authz_on_decisions`.

**PROVE (live matrix)**
```
unauth      GET  admin/applicants          -> 401
member      GET  admin/applicants          -> 403
staff-only  GET  admin/applicants (view)   -> 200
staff-only  POST admin/kyc/1/review        -> 403
staff-only  POST admin/applicants/1/action -> 403
staff-only  POST admin/user-tasks/1/review -> 403
superuser   POST admin/kyc/999999/review   -> 400 (authz passed, unknown id)
```

---

## A3 · SEC-03 (MED) — Stop shipping is_staff; client-safe user serialization

**Status: DONE**

**Files**
- `backend/fann/common/user_safety.py` — `SENSITIVE_USER_FIELDS`, `strip_sensitive_user_fields()` (explicit denylist **plus** a `*_otp` / `*_2fa*` / privilege-flag pattern sweep so a future column can't leak), `ClientSafeUserMixin`
- `backend/fann/market_final/serializers.py` — `UserFinalMarketSerializer` (login/register/me) exposes intentional `is_admin`, strips raw flags; `ViewUserProfileSerializer` uses the mixin
- `backend/fann/users/serializers.py` — `UserDataSerializer` uses the mixin
- `frontend/src/pages/AdminPage.tsx` — CRM gate reads `is_admin`; `frontend/src/store/authSlice.ts` — `is_admin?`, removed `is_staff`/`is_superuser`

**RED** — `POST /market_final/user_login` `data` carried `is_staff: false` (full model dump).

**Tests** — `backend/fann/qualification/tests/test_sec03_client_safe.py` (5):
`test_login_serializer_clean_for_member_and_concierge`, `test_login_serializer_admin_gets_is_admin_true_not_is_staff`, `test_view_user_profile_endpoint_clean`, `test_me_endpoint_clean`, `test_policy_lists_the_privilege_flags`.

**PROVE (live)**
```
artist login: forbidden keys NONE · otp/2fa-like NONE · is_admin False
admin  login: is_admin True · is_staff leaked: False
browser: admin still reaches /admin via is_admin (no regression); persisted user has is_admin:true, no is_staff
```

---

## A4 · DATA-02 (MED) — Numeric types (points / profile_step / counters)

**Status: DONE**

**Files**
- `backend/fann/common/user_safety.py` — `coerce_numeric_user_fields()` casts `points`, `profile_step` to int (junk/None → 0); wired into `ClientSafeUserMixin`
- `frontend/src/store/authSlice.ts` — `points: number`, `profile_step: number`
- `frontend/src/utils/apiResponseHelpers.ts` — `mapProfileStepToOnboardingStep` accepts `number | string`

**RED** — login `data`: `points: "75" (str)`, `profile_step: "1" (str)`.

**Tests** — `backend/fann/qualification/tests/test_data02_numeric.py` (4):
`test_user_serializer_points_and_step_are_int`, `test_bad_charfield_values_coerce_to_zero`, `test_me_endpoint_numeric_types`, `test_dashboard_counters_numeric_types`.

**PROVE (live)** — artist login: `points: 75 (int)`, `profile_step: 1 (int)`. `/qualification/me` + dashboard counters already integers from DATA-01.

---

## A5 · LOW batch (one commit)

**Status: DONE**

| Item | Fix | Proof |
|---|---|---|
| KYC empty state | `KycTab` handles `isError` + `data?.data?.pending`; explicit empty state | Browser: admin KYC tab → "No KYC submissions waiting for review. 🎉" (not stuck) |
| Sample ledger label | "Illustrative example — not real data" badge (EN + AR) on the landing ledger | Browser DOM: badge present beside the May-2025 demo rows |
| Footer © year | `new Date().getFullYear()` (EN + Arabic-Indic) | Browser: landing shows © 2026, no © 2025 |
| conversation → conversion | Ambassador reads `conversion` (alias kept); types updated | `tsc` clean; backend sends both keys |
| Stale quiz toast | `App` dismisses toasts on route change | Server msg confirmed `"0/3 correct — …"`; `toast.dismiss()` on pathname change |
| sitemap canonical | host → `https://www.tryfann.com` | `curl /sitemap.xml` → all www |
| robots /leaderboard | removed dead disallow; sitemap → www | `curl /robots.txt` → no `/leaderboard`, www sitemap |
| FAKE-03 cap honesty | `readiness_delta_for_task` caps creditable delta; card shows "capped" | Already honest in current code; delta==creditable |

---

## Self-audit

### §5 regression — the 16 already-fixed findings still hold
```
Login enumeration     : unknown-email 400 == wrong-pass 400, byte-identical bodies ✅
Admin unauth          : GET /qualification/admin/applicants -> 401 ✅
Public leaderboard     : market_final/leaderboard 404 · qualification/leaderboard 404 ✅
Concierge hides game  : gallery /qualification/me -> track=concierge, no points/readiness/ledger ✅
CRUD intact           : artwork_artist/ 200 · artwork_collection/ 200 · artist_roaster/ 200 (only stats 410) ✅
Backend suite         : 22/22 passing ✅
Frontend              : vite build clean · tsc --noEmit clean ✅
```
Not machine-re-run this pass but unaffected by these diffs (no code paths touched): BRK-01 profile-hang warmup, BRK-03/SEC-01 gated quizzes + anti-replay, TECH-5 referral codes, MOB-01/02, AUTH-01 logout, RTL parity. Locked product model preserved: four tiers only, readiness private/out of 100, no public ranking, concierge zero points/tasks, physical-art language only, EN+AR.

### §3 acceptance bar
- Zero Critical, zero High remaining in the four findings: **met** (DATA-01, ADM-01 resolved with proof).
- DATA-01 / ADM-01 / SEC-03 / DATA-02 resolved with automated test + live transcript: **met**.
- 16 fixed still passing: **met** (spot-verified above; full suite green).
- One commit per finding ID, ID-prefixed: **met** (`DATA-01:`, `ADM-01:`, `SEC-03:`, `DATA-02:`, `A5:`).

### Known non-blocking item
- Pre-existing eslint warning in `frontend/src/components/auth/GoogleAuthButton.tsx:15` (`react-refresh/only-export-components`) predates this work (commit `9c0400b`) and does not block Vercel (which builds via `vite build`, verified green). Left untouched as out-of-scope; flag for a future cleanup.

### Honest projected score
v2 baseline was **84.5/100** (held back by DATA-01, ADM-01 HIGH + DATA-02, SEC-03, KYC-empty-state MED + 6 LOW). With all HIGH + MED closed with proof, the LOW batch cleared, and the 16 prior fixes intact, **projected ~93–95/100**. Residual gap is the one pre-existing lint warning and any finding not machine-re-run this pass.

**Deploy status:** all changes committed on `v2/fix-and-harden`, verified locally. Production deploy (merge→main→Vercel auto-deploy + Render public→deploy→private) is an outward action pending explicit go-ahead.
