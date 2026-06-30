# TryFANN — Implementation Task List

> Living tracker for the TryFann pre-launch implementation mandate. Each item maps to an
> acceptance criterion from the mandate. Items are checked off as they land.
>
> **Important:** Local-only work. No pushes to the remote. Each commit is reviewed before
> the next one begins.

---

## Status

- **Current phase:** Phases 3–6 — **complete**. P3: qualification engine. P4: role-aware dashboards (6 roles). P5: tasks/missions engine. P6: staff-only CRM at `/admin` (overview/funnel/UTM, pipelines, lead scoring, whitelist console, CSV, referral tree). Remaining: Phase 7 leftover (prerender, deferred) + Phase 8 launch gate. Operator login: `ops.admin@local.dev` (staff).
- **Last reviewed commit:** *(pending review)*
- **Backend decision (ask-once gate):** **Extend the local Django clone** + **SQLite** (user choice, 2026-06-10). Work lives on local branch `local/tryfann-qualification` in the `fann` clone; push URL disabled; production remote + live server untouched.
- **Stack deviations approved:** D1 (keep Vite SPA, add SSR/prerender later) · D2 (keep Django, add `qualification` app) · D3 (deprecate `market_final` gamification, do not delete) · D4 (disable `fann.analysisai` for local dev)

---

## REBUILD — Full Platform (Design + Functionality + Super Admin)

> Directive 2026-06-16. Gallery-grade visual rebuild on a single token system + fully working
> flows + Super Admin. Visual layer rebuilt from scratch; functional layer (APIs, routing, auth,
> qualification engine, form handlers, role logic) re-wired untouched. One step at a time:
> dev server → Chrome test → screenshot → pause. Type: **Cormorant Garamond** + **DM Sans** +
> IBM Plex Sans Arabic (RTL). Source of truth: `src/styles/tokens.css` (pixel-sampled from Figma).

- [x] **Step 1 — Token foundation.** `src/styles/tokens.css` (CSS vars + Tailwind v4 `@theme inline`); Cormorant Garamond + DM Sans loaded; sage `#6B8A7B` + forest `#2D493A` pixel-sampled from mockups; `/design-proof` swatch/type proof shipped + verified live (all 3 faces load, bridge utilities resolve, no console errors, build + lint pass).
- [ ] **Step 2 — Shared chrome + primitives** (Nav, Footer+ticker, Button, Card, Eyebrow, SectionHeader, IconChip, StatusPill, ProgressStepper, form primitives, Modal, Toast) — tested on `/design-proof`.
- [x] **Step 3 — Landing page** (`TfLanding.tsx`): nav+lang toggle, hero, trust strip, roles 02, how-it-works 03 + cream manifesto, readiness ledger 04 preview, founder's circle 05, FAQ, final CTA, footer+ticker. Real photography extracted from mockups → `src/assets/landing/figma/`. Bilingual EN/AR + RTL verified. Committed `8068da3`. (Note: Step 2 primitives were built inline here; will extract to a shared lib as more screens reuse them.)
- [ ] **Step 4 — Auth screens** (sign-up/in, reset, verify) — fully functional.
- [ ] **Step 5 — Application/onboarding flow** (all 6 roles) — fully functional, save-progress, concierge zero-game-UI probe.
- [ ] **Step 6 — Readiness Ledger page** — real backend data.
- [ ] **Step 7 — Founder's Circle page.**
- [ ] **Step 8 — All 6 role dashboards** (game + concierge) — real data, concierge DOM probe.
- [ ] **Step 9 — Super Admin panel** at `/superadmin` (KYC review, user mgmt, whitelist console, referral/fraud, analytics, content mgmt, separate auth).
- [ ] **Step 10 — Final integration test + `PRODUCTION_READY.md`.**

---

## Phase 0 — Discovery & plan

- [x] Inventory the repo: stack, frameworks, routes/pages, components, data schema, auth, env vars, email, analytics, build/test commands
- [x] Identify existing waitlist / points / referral / leaderboard logic
- [x] Stack & architecture findings report delivered
- [x] Phase-by-phase task plan delivered
- [x] Risks, blockers, open questions delivered
- [x] **STOP and await go-ahead** — approved

## Phase 1 — Remove the trust-killers

Acceptance: no fabricated numbers anywhere · no empty/public leaderboard · no MLM copy · clean footer · provenance-led messaging · tiers named correctly.

- [x] Remove fabricated metrics from `src/components/Hero.tsx` (EN + AR)
- [x] Remove fabricated metrics from `src/components/SignUp.tsx` (20K+/2K+/1K+ → honest trust strip)
- [x] Remove fabricated metric from `src/components/SignIn.tsx` (500+/1.2K+/150+ → "Verified" per audience, EN + AR)
- [x] Remove AR/VR references in `src/components/Hero.tsx` (EN + AR)
- [x] Remove AR/VR reference in `src/components/onboarding/WelcomeStep.tsx` (EN + AR)
- [x] Remove MLM copy "Your Network is Your Net Worth" in `src/components/ReferralModule.tsx` (EN + AR)
- [x] Audit social links in `src/components/Footer.tsx` — removed dummy accounts (Reddit `Fun-Commercial-7646`, Lottiefiles, Dribbble, Behance `infoart`); kept real fannarttech channels; dropped now-unused icon imports
- [x] Remove PUBLIC leaderboard (route gated to authenticated members; removed homepage section, public nav link, footer quick-link). Authed dashboard leaderboard kept working.
- [~] Delete `src/pages/LeaderboardPage.tsx` — **kept** (route-only removal chosen; file retained for authed use)
- [~] Delete `src/components/Leaderboard.tsx` — **kept** (route-only removal chosen)
- [x] Rename tiers — **public copy** (FAQ EN+AR) → §5.4 names `Waitlisted / Verified Member / Priority Access / Founder's Circle` ("earned, never bought"). Mapping: Explorer→Waitlisted, Curator→Verified Member, Patron→Priority Access, Founding Patron→Founder's Circle (Ambassador tier dropped).
- [~] Tier rename in backend-coupled surfaces (`RewardsTiers.tsx`, `tierSystem.ts`, `TierProgress.tsx`, dashboards) — **deferred to Phase 3/5 whitelist engine** (tier names come from the server; cosmetic rename now would break the API mapping and be redone). Tracked under Phase 5.
- [x] Strip "immersive technology" / metaverse-flavored copy from hero accent line (EN + AR)
- [x] **(found during cleanup)** Reframe AR/VR content in `src/components/FAQ.tsx` → Provenance Viewer (EN + AR; 3 spots each)
- [x] **(found during cleanup)** Reframe AR/VR content in `src/pages/HomePage.tsx` FAQ data → Provenance Viewer (EN + AR)
- [x] **(found during cleanup)** Remove "AR previews" perk in `src/components/onboarding/GamificationStep.tsx` → "Early previews" (EN + AR)
- [x] Replace metaverse-flavored stats with honest qualitative descriptors ("Pre-launch", "Founding cohort capped", "Application-based")
- [ ] Run `npm run lint` clean
- [ ] Run `npm run build` clean

## Phase 2 — Role-based entry & segmented signup

- [x] Role-selection-before-form gate — default persona now `null`; Continue disabled until a role is chosen (was defaulting to "artist")
- [x] Re-enable `curator` + `investor` role cards → all 6 roles; dropped points from cards; Gallery + Investor show a "Concierge" tag (no points)
- [ ] Build role-specific multi-step forms persisting to `RoleProfile`
- [x] Gallery + Investor → concierge ONBOARDING track (no Interests, no GamificationStep); WelcomeStep swaps "Gamified Rewards" for a concierge feature; CompletionStep has a concierge "application in review" view (no points/tier/leaderboard). Verified investor flow shows no points UI. *(Concierge DASHBOARD view is Phase 4.)*
- [ ] Wire `VITE_API_BASE_URL` env variable; remove hardcoded API base URL in `src/services/api/baseApi.ts:16`

## Phase 3 — Backend spine & security

**Local bring-up (done):**
- [x] Decision gate resolved: extend local Django clone + SQLite (see Status)
- [x] Local branch `local/tryfann-qualification` + push URL disabled (never pushed)
- [x] `core/settings_local.py` + `core/urls_local.py` — `market_final` funnel on SQLite, ML/web3 apps excluded
- [x] Light venv (`requirements-local-tryfann.txt`) — no torch/tf/faiss/web3; `migrate` → 53 tables
- [x] Frontend wired: `baseApi.ts` reads `VITE_API_BASE_URL`; `tryfann/.env.local` → `http://localhost:8000/api`; `.env.example` committed; `tryfann-local-backend` in launch.json
- [x] Verified end-to-end: live Vite app logs in vs `localhost:8000` (CORS OK, all 200) → collector dashboard
- [ ] Rename `progression` tiers to §5.4 whitelist ladder (currently old point tiers) — qualification-engine work

**Qualification app (next):**
- [x] New Django app `fann/qualification/` (registered in `settings_local`)
- [x] Models: `RoleProfile`, `WhitelistEntry` (§5.4; folds WaitlistEntry+WhitelistReview via `manual_override`+AuditLog), `PointsLedger` (append-only, `dedupe_key`), `ReferralCredit`, `AuditLog`, `AnalyticsEvent` — migrated; smoke-tested
- [ ] `Task` / `UserTask` — deferred to Phase 5 tasks engine
- [x] Server-side `compute_readiness_score(user)` + `completion_pct` + §5.4 `tier_for_score` (config-driven weights/thresholds in `scoring.py`)
- [x] Idempotent `award_points` (append-only, `dedupe_key`) + `recompute` + guarded signal hooks (signup / KYC / verified-referral)
- [x] Verified-referrals-only logic (credit only after referee verified + ≥50% completion; auto-fires on verification)
- [x] Anti-fraud: self-referral guard + verified-only + dedupe + **disposable-email block** + **signup IP/UA fingerprint** + **same-IP referral block** + dup-IP soft flag (AuditLog). (Client-side device fingerprinting still future.)
- [x] Rate limits on `/register` (10/hour) and `/refer` (30/hour) via DRF ScopedRateThrottle — verified (11th register → 429)
- [x] `POST /api/qualification/analytics/events` + frontend emission (`landing_view`, `signup_role_selected`, `signup_submitted`) — verified live
- [x] DRF endpoints: `GET /api/qualification/me` (concierge-gated), `POST /role-profile`, `POST /analytics/events` — live-verified vs JWT
- [x] Frontend: `qualificationApi` RTK slice + bilingual `ReadinessCard` on collector dashboard (live-verified: Verified Member / 50% / 150 pts)
- [x] `ReadinessCard` on all dashboards (artist/ambassador/gallery + investor/curator fallback); concierge variant verified for investor
- [x] **P1 mandate violation FIXED:** concierge (investor/gallery/org) no longer see `PointWallet`/`TierProgress`/`WatchVideos`/`URLEncoder`. `isConciergeRole` helper gates them in `DashboardPage` + `GalleryDashboard`. Verified live: investor = readiness card only; collector (game) unchanged.
- [x] **§5.4 reconciliation (game users):** PointWallet now sources balance + tier from qualification `/me` (ledger + §5.4); retired the legacy `TierProgress` (Explorer/Curator ladder) from game dashboards. One tier + one balance everywhere. Verified live (collector: Verified Member / 150, no Explorer).

## Phase 4 — User dashboards (role-aware)

- [x] Role-aware dashboard router (collector / gallery / ambassador / investor / artist-default in `DashboardPage`)
- [x] Dedicated **InvestorDashboard** (concierge: readiness + next-action + investment-focus form via role-profile; no game widgets) — verified live
- [x] Single **"Next Action" CTA** (`NextActionCard`, shared) — on investor + all game dashboards (collector/artist/ambassador). Verified live.
- [x] **Readiness Ledger** — `ReadinessCard` (game) now lists recent PointsLedger entries with EN/AR reason labels + deltas. Verified live (collector: "Identity verified +100, Joined FANN +50").
- [x] `curator/` dedicated dashboard (game track: next-action + readiness/ledger + PointWallet/referral/videos, no artwork upload). Backend: Curator added to register + login role lists (fann `15fdb68`, `23c4234`); **fixed fingerprint score leak** (signup_ip/ua no longer grants the +15 role_details signal). Verified live end-to-end.
- [x] Concierge dashboards: **investor + gallery** both purpose-built (readiness + next-action + concierge note; gallery keeps ArtistRoster/AddArtwork tools). Dead game widgets removed. Verified live.
- [x] Roll `NextActionCard` onto the game dashboards (collector/artist/ambassador)

## Phase 5 — Tasks & whitelist engine

- [x] Seed 7 mandate-spec tasks (4 instant game missions + portfolio_submission manual Artist/Curator + gallery_roster / book_onboarding_call as 0-point concierge-tracked records never shown as missions). Migration `0003_seed_tasks`.
- [x] `GET /api/qualification/me/tasks` + `POST /me/tasks/:key/complete` — role-filtered; concierge → empty list (mandate §2); instant = idempotent immediate award; manual = PENDING, no points
- [x] Manual approval workflow — Django-admin bulk Approve/Reject actions → `approve_user_task` (award + recompute + AuditLog); Phase 6 CRM will build on it
- [x] Whitelist promotion + transactional email on approval (tier-change detection → send_mail; console backend locally, verified output)
- [x] Approved tasks feed readiness (+2 each, capped 10) so missions genuinely move the §5.4 ladder
- [x] Frontend `MissionsCard` (EN/AR) on all game dashboards — verified live (curator: complete quiz → +30 pts, Done, ledger "Mission completed")
- [x] **(carried from Phase 1)** §5.4 served by qualification `/me`; all live UI reads it (ReadinessCard/PointWallet); `RewardsTiers.tsx` + `TierProgress.tsx` are now dead files (kept, unreferenced); legacy `progression` endpoint still returns old names but nothing renders it

## Phase 6 — Admin CRM & analytics

- [x] Frontend admin console at `/admin` (`src/pages/AdminPage.tsx` + `adminApi`) with `is_staff` guard (UI redirect + backend `IsAdminUser` 403) — verified both ways
- [x] Pipelines per role (per-role columns, top applicants by readiness)
- [x] Lead-scoring view (applicants table sorted by readiness; score/completion/tier/points/verification flags/pending count/fraud marker; role/tier/email filters)
- [x] Whitelist console (prioritize → Priority Access w/ override + email; set_tier; flag; clear-override+recompute; mission Approve/Reject queue) — UI prioritize verified live
- [x] **CSV export** (authed download, respects filters)
- [x] Referral-tree visualisation (referrer → referees w/ verified/credited state; surfaces blocked self-referral + same-IP cases)
- [x] UTM attribution + funnel dashboard (utm_source from landing_view props; landing → role → submit → created → verified)
- *Note:* console is English-only by design (internal back-office tooling, not user-facing copy)

## Finish & launch-ready run (master prompt)

- [x] **Step 0 — secrets hygiene:** both repos audited. tryfann clean (no tokens in config/history; .env.local ignored; .env.example tracked). fann: our 9 commits clean; flagged pre-existing upstream hardcoded secrets in `core/settings.py` (Django SECRET_KEY, SMTP password, MoonPay test keys) → FANN team to rotate + move to env. User revoking the 2 chat-exposed PATs.
- [x] **Step 1a — sign-up + role gate redesign** (`91c14b7`): landing token system app-wide (global import), catalogue role cells w/ gold selected ring + concierge pills, Playfair headings, gold buttons w/ focus/disabled/loading states, honest referral copy (removed fabricated "+250 bonus points"). Verified EN + AR/RTL. *(pending review)*
- [x] Step 1b — sign-in, password reset, email-verification screens (`fbcb597`): same token system; teal/cyan fully retired from auth; gold CTAs with full state set; verified live (sign-in, reset form + success). *(pending review)*
- [x] Step 1c — onboarding steppers (`0449e34`): gold token stepper + track eyebrows (game "Founding onboarding" vs concierge "Founding application — concierge review"); `.glass` legacy bridge re-skins all step cards; **fixed artist-label leak** (curator/investor now have role-appropriate EN+AR application copy). Verified live both tracks. *(pending review)*
- [~] Step 2 — dashboard IA + polish per role:
  - [x] Collector (`149ec14` + fann `f2c3b7a`): readiness w/ server-truth score breakdown (earning/missing + weights), ONE next action, missions, referral quality strip (verified vs clicks), ActivityCard ledger, tools demoted; PointWallet + CompleteProfile banner retired. Verified live. *(pending review)*
  - [x] Ambassador (`064c890`): same IA; readiness breakdown + referral quality + activity; reach/social KPIs retained; PointWallet + banner retired. Verified live. *(pending review)*
  - [x] Investor + Gallery (`7178e3a`): concierge IA — ApplicationStatusCard + ConciergeContactCard + FannUpdatesCard; ReadinessCard/NextActionCard removed; Leaderboard nav gated off for concierge. **Strict DOM probe (textContent incl. hidden) = points/missions/readiness/leaderboard ALL 0** on both. Verified live. *(pending review)*
  - [x] Artist + Curator (`5c5809c`): same game IA; new ConciergePathCard surfaces a representation/advisor invitation only at Priority Access / Founder's Circle (artist/curator). Verified live — top-tier artist sees it, waitlisted curator does not. *(pending review)*
  - **Step 2 complete** — all 6 role dashboards reorganized to the IA.
- [x] Step 3 — consistency + states sweep (`f7aee3b`): DashboardLayout carries `.fann-landing` token scope app-wide; error+retry states on hero cards; eslint 0 + green build validate consistency.
- [x] Step 4 — SEO (`f2eb12e`): static OG/meta confirmed; **robots.txt + sitemap.xml + static JSON-LD** added; prerender intentionally declined (high-effort/low-value on this SPA) — lighter alternative shipped.
- [x] Step 5 — **launch-readiness gate → GO** (`LAUNCH_READINESS.md`): mandate checklist all PASS; 6-role walkthrough; anti-fraud (disposable 400, rate-limit 429, same-IP block) + admin 403 re-verified; build/eslint/django green; no console errors. Verdict GO for local pre-launch; pre-deploy actions documented (rotate upstream secrets, Lighthouse/chunk-split, prod API base, revoke PATs).

## Phase 7 — Frontend, SEO & premium visual (PULLED FORWARD — landing redesign)

Staging at additive route `/redesign` (live HomePage untouched until full approval).
Tokens verified against live app.fann.art: bg #0B0B0D · gold #C59B48 · text #F2F2F3 ·
Playfair Display 900 + Inter + IBM Plex Sans Arabic. Gold-only restraint.
Signature device: the Provenance Diptych (artwork + verifiable record).

- [x] Step 1 — extract & verify FANN tokens (live + repo) → `src/styles/landing-tokens.css`
- [x] Step 3 — design plan + hero (asymmetric split + Provenance Diptych) — approved
- [x] Redesign §1 Hero — `HeroRedesign.tsx` (EN/AR, RTL, reduced-motion, focus) — verified desktop + mobile
- [x] Redesign §2 Role selector (6 roles, tactile catalogue grid)
- [x] Redesign §3 Why FANN (chain-of-custody timeline + sample certificate card)
- [x] Redesign §4 How TryFann works (horizontal 4-step stepper)
- [x] Redesign §5 Role benefits (supply/demand editorial columns)
- [x] Redesign §6 Founding-access portal preview (premium dashboard mock; mandate tier names + Readiness)
- [x] Redesign §7 FAQ (accessible accordion; anti-NFT entry leads; mandate tier names)
- [x] Redesign §8 Final CTA + footer (clean, real FANN channels only)
- [x] Swap approved redesign into HomePage (live `/` now renders the 8-section redesign; old homepage components retained but orphaned)
- [x] Landing nav polish — extracted `LandingNav` (sticky, transparent→glass on scroll) with a mobile hamburger drawer (links + language toggle + sign-in + claim). Verified EN desktop/mobile + RTL.
- [ ] SSR / prerender for `/`, `/signin`, `/signup`, `/ref/:code`
- [x] Open Graph + Twitter card images — created `public/og-image.jpg` (1200×630, from the CC0 artwork via sips); added og:image/twitter:image + og:url + canonical to `index.html` static fallback; refreshed static + runtime (seoConfig) title/description to the founding-access positioning (dropped points-game copy). Runtime `SEOHead` already sets per-route OG/Twitter.
- [~] SSR / prerender for `/`, `/signin`, `/signup`, `/ref/:code` — **decision pending** (needs a headless-browser prerender dep; client SEOHead + static index.html fallback covers most scrapers in the meantime). Note: OG image is the artwork crop; a branded card (wordmark + tagline overlay) is an optional upgrade.
- [x] Apply "Provenance" design-system tokens (per landing-redesign mockup)
- [ ] Audit every page for loading / empty / error / success / rejected / flagged states
- [ ] Mobile keyboard overlap audit on multi-step forms

## Phase 8 — Launch-readiness gate

- [ ] SSO / export bridge to FANN marketplace
- [ ] Capped founding-cohort scarcity mechanic
- [ ] Definition of Done walkthrough (Mandate §7)
- [ ] Soft launch

---

## Commit log (most recent first)

- `feat(api): wire frontend to local backend via VITE_API_BASE_URL + .env.example` — *(pending review)*
- `feat(admin): staff-only CRM console at /admin (Phase 6)` — `4eaf754`
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): admin CRM API (Phase 6)` — `119ff29` *(never pushed)*
- `feat(dashboard): Founding Missions card wired to the tasks engine (Phase 5)` — `b6496cf`
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): tasks engine (Phase 5)` — `bd66e10` *(never pushed)*
- `feat(dashboard): dedicated CuratorDashboard (Phase 4)` — `625f12a`
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): allow Curator login + fix fingerprint score leak` — `23c4234` *(never pushed)*
- *(fann clone, branch `local/tryfann-qualification`)* `local(users): accept Curator as a signup role` — `15fdb68` *(never pushed)*
- `feat(dashboard): readiness ledger (recent activity) for game users` — `1c315ed`
- `feat(dashboard): purpose-built concierge GalleryDashboard (Phase 4)` — `d70fd47`
- `feat(dashboard): NextActionCard on all game dashboards` — `b321b65`
- `feat(dashboard): dedicated concierge InvestorDashboard (Phase 4)` — `002a664`
- `feat(analytics): emit funnel events to the qualification backend` — `b0214d7`
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): anti-fraud + rate limits on register/refer` — `edc5f9b` *(separate repo; never pushed)*
- `fix(dashboard): unify game-user tier/balance on the qualification source` — `8118dd9`
- `fix(dashboard): gate points/missions widgets from concierge roles` — `ff59349`
- `feat(dashboard): show Founding Readiness card on all role dashboards` — `60e5b6c`
- `feat(dashboard): wire qualification API + Founding Readiness card` — `5ab8295`
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): DRF endpoints (me / role-profile / analytics)` — `ec2c729` *(separate repo; never pushed)*
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): scoring, idempotent awards, verified-referral hooks` — `0e1cd23` *(separate repo; never pushed)*
- *(fann clone, branch `local/tryfann-qualification`)* `local(qualification): add qualification spine models (Phase 3)` — `e56af66` *(separate repo; never pushed)*
- *(fann clone, branch `local/tryfann-qualification`)* `local(tryfann): run market_final funnel on SQLite, no torch/web3` — `32d39a8` *(separate repo; never pushed)*
- `polish(signin+onboarding): de-point SignIn panel + provenance-led WelcomeStep intro` — `7f2332b`
- `polish(signup): de-point left panel + §5.4 tier name` — `405beef`
- `feat(onboarding): concierge track for gallery/investor, no points (Phase 2 C2)` — `c34e340`
- `feat(signup): role-first gate + all 6 roles, de-pointed cards (Phase 2 C1)` — `e4b16bc`
- `feat(seo): OG image + Open Graph/Twitter meta + aligned titles` — `a13e817`
- `feat(landing): sticky LandingNav with mobile drawer` — `137811a`
- `feat(landing): make redesign the live homepage; functional hero nav` — `dd1defb`
- `fix(content): rename FAQ tiers to §5.4 whitelist names (public copy)` — `ffa4699`
- `fix(content): remove public leaderboard (gate to authed; keep files)` — `50955d6`
- `fix(content): footer real FANN channels only (drop dummy links)` — `d1ba6a7`
- `fix(content): remove fabricated metrics from SignUp + SignIn` — `c5dcfc0`
- `fix(content): de-MLM the referral module` — `60ab659`
- `chore(landing): preview-only EN/AR toggle on /redesign` — `d3b73d2`
- `feat(landing): closing CTA + clean footer (redesign §8)` — `017c56d`
- `feat(landing): FAQ accordion incl. anti-NFT entry (redesign §7)` — `56cb426`
- `feat(landing): founding-access portal preview (redesign §6)` — `bd4c574`
- `feat(landing): role benefits supply/demand columns (redesign §5)` — `b2b56e8`
- `feat(landing): how-it-works 4-step stepper (redesign §4)` — `eec2d52`
- `feat(landing): why-FANN trust timeline + certificate card (redesign §3)` — `b706cf9`
- `feat(landing): role selector catalogue grid (redesign §2)` — `eec5244`
- `feat(landing): redesign hero + design tokens at /redesign preview` — `e1eac4b`
- `refactor(content): replace all AR/VR language with Provenance Viewer` — `4a67f5f`
- `feat(hero): provenance-led copy, drop AR/VR + immersive language` — `00fae6b`
- `feat(hero): replace fabricated stats with honest trust strip` — `c7300ee`
- `chore: add TRYFANN_TASKS.md tracker for mandate execution` — `f3e2ccd`

---

## Open questions to resolve before Phase 2

- Q4: Figma access for curator / investor / concierge / admin UI?
- Q5: Email provider + analytics provider (default suggestion: Resend + PostHog)?
- Q7: Are we allowed to inspect `fann/fann-fe/` (the sister Next.js frontend) for context?
