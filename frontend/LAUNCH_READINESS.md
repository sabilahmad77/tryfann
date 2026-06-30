# TryFANN — Launch-Readiness Gate (Phase 8)

**Verdict: ✅ GO** for the local pre-launch build — complete and verified end-to-end.
Three documented **pre-deploy actions** must be done by the FANN team before any *public*
deployment (listed at the bottom). Per the mandate this work is **LOCAL ONLY**; nothing is
pushed or deployed.

_Generated after Steps 0–5 of the Finish & Launch run. Evidence is from live local runs
(Vite `:3000` + local SQLite Django `:8000`)._

---

## Mandate checklist (§2 absolute rules)

| # | Rule | Status | Evidence |
|---|------|--------|----------|
| 1 | LOCAL ONLY — no push / remote / deploy | ✅ PASS | tryfann 67 commits ahead of origin, never pushed; fann work on local branch `local/tryfann-qualification`, push URL disabled |
| 2 | Don't touch the real fann server/remote | ✅ PASS | only the local clone modified; live `api.fann.art` untouched; frontend points at `localhost:8000` via `.env.local` |
| 3 | No fabricated metrics | ✅ PASS | landing stats removed Phase 1; removed the fake "+250 bonus points" signup toast; all points come from the server ledger |
| 4 | No NFT / crypto / AR-VR language | ✅ PASS | "Provenance Viewer" / "blockchain-backed certification" only |
| 5 | All points/scores/tiers/whitelist server-side | ✅ PASS | `PointsLedger` (append-only) + `compute_readiness_score` + §5.4 `WhitelistEntry` in backend; UI reads `/me` |
| 6 | Investor/gallery NEVER see points/missions/leaderboard | ✅ PASS | DOM probe (textContent incl. hidden) on both = **points 0 · missions 0 · readiness 0 · leaderboard 0** |
| 7 | English + Arabic (RTL) parity | ✅ PASS | every new screen has EN+AR; RTL verified (dir=rtl, IBM Plex Sans Arabic, Arabic-Indic numerals, mirrored layout) |
| 8 | Whitelist quality-gated | ✅ PASS | tier from readiness thresholds + KYC; manual review queue; verified-referrals-only |
| 9 | No destructive ops without confirmation | ✅ PASS | none performed |

## Engineering gates

| Check | Status | Evidence |
|-------|--------|----------|
| Frontend ESLint (whole `src`, `--max-warnings 0`) | ✅ PASS | exit 0 |
| Vite production build | ✅ PASS | `built in ~8s`, exit 0 (only a pre-existing chunk-size warning) |
| Django system check (local settings) | ✅ PASS | "no issues (0 silenced)" |
| Console errors on landing | ✅ PASS | none |
| Phase 3 logic intact | ✅ PASS | collector `/me` → game, Verified Member, score 37, points 180 |

## Cross-role walkthrough (all 6 roles, live)

| Role | Track | Result |
|------|-------|--------|
| Collector | game | readiness breakdown + missions + referral-quality + ledger; points via server ledger only |
| Ambassador | game | same IA + reach KPIs |
| Artist | game | readiness → next action → **concierge path (top-tier)** → missions → portfolio |
| Curator | game | same; concierge path correctly **absent** when waitlisted |
| Investor | concierge | application status + what's-next + concierge contact + FANN updates — **zero game UI** |
| Gallery | concierge | same + gallery tools — **zero game UI** |

## Anti-fraud & rate limits (live)

| Control | Status | Evidence |
|---------|--------|----------|
| Disposable email blocked | ✅ | `mailinator.com` → 400 "Please use a permanent email address." |
| Register rate limit | ✅ | 9×200 then **429** (10/hour) |
| Self / same-IP referral blocked | ✅ | same signup IP → no credit + `fraud_flag` AuditLog (verified earlier) |
| Verified-referrals-only | ✅ | credit only after referee email-verified + ≥50% completion |
| Admin CRM staff-only | ✅ | non-staff token → **403** on `/admin/overview` |

## Secrets hygiene (Step 0)

- tryfann: ✅ no tokens in config or any of 67 commits; `.env.local` gitignored; `.env.example` tracked.
- fann: ✅ our local commits clean; push disabled.
- ⚠ Pre-existing **upstream** hardcoded secrets in `fann/core/settings.py` (Django SECRET_KEY, SMTP password, MoonPay test keys) — FANN team to rotate + move to env. Not introduced by this work; not touched (mandate).

## Accessibility / mobile / Lighthouse

- ✅ Visible keyboard focus (`fann-focus` outline), AA contrast (gold #C59B48 / bone #F2F2F3 on #0B0B0D), `prefers-reduced-motion` honored in tokens, responsive single-column verified in screenshots, no layout shift observed.
- ⚠ **Lighthouse not executed in this local harness.** Recommend `npx lighthouse http://localhost:3000 --view` against the preview before deploy. (Note: the legacy `custom-form-elements` chunk is ~8.9 MB — a real perf item to code-split before a public launch; not a blocker for local pre-launch.)

---

## Blockers
**None** for the local pre-launch product.

## Pre-deploy actions (owned by FANN team, before any public deploy)
1. Rotate the upstream `core/settings.py` secrets and move them to environment variables.
2. Run Lighthouse; code-split the oversized `custom-form-elements` chunk for perf.
3. Set the production `VITE_API_BASE_URL` to the real backend and stand up the qualification
   models there (the local `qualification` app is the reference implementation).
4. Revoke the 2 GitHub PATs exposed earlier in chat (separately in progress).

**GO** — the TryFANN pre-launch lead-qualification product is feature-complete, mandate-
compliant, and verified locally across all six roles.
