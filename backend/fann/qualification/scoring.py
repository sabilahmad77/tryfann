"""
Server-side Readiness Score (§3.1) + quality-gated tier mapping (§3.3/§3.4).

The score is built from six weighted components — never a client-supplied
value, never a points race:

    Profile completion   20   how complete the role profile is
    Answer quality       20   substance of onboarding answers (not one-word)
    Strategic fit        20   match to FANN's mission / target market
    Referral quality     15   verified, completed referrals only
    Task completion      15   trust-education modules approved
    Admin override       10   human judgement the model can't capture
                        ----
                        100

Answer quality + strategic fit read the role's onboarding answers from
`User.application_data` (captured by the Point 2 funnel). Weights/heuristics
are a starting design to calibrate against real data — not fixed law.
"""
from fann.qualification.models import ReferralCredit, WhitelistEntry

COMPONENT_WEIGHTS = {
    "profile_completion": 20,
    "answer_quality": 20,
    "strategic_fit": 20,
    "referral_quality": 15,
    "task_completion": 15,
    "admin_override": 10,
}
COMPONENT_ORDER = list(COMPONENT_WEIGHTS.keys())

REFERRAL_PER = 5  # score per verified referral toward referral_quality
TASK_PER = 5      # score per approved task toward task_completion

# §3.4 — these roles are never auto-whitelisted; a human approves first.
HARD_ROLES = {"artist", "gallery", "investor"}

# Meta keys stored alongside answers that are NOT user substance.
META_KEYS = {"role", "track", "signup_ip", "signup_ua"}

# Number of answer fields the Point 2 schema collects per role (for completion).
EXPECTED_FIELDS = {
    "artist": 8,
    "gallery": 11,
    "collector": 6,
    "curator": 6,
    "investor": 10,
    "ambassador": 6,
}


def _safe(getter, default=False):
    try:
        return getter()
    except Exception:
        return default


def _norm_role(user):
    return (getattr(user, "role", "") or "").strip().lower()


def _app_data(user):
    d = getattr(user, "application_data", None)
    return d if isinstance(d, dict) else {}


def _empty(v):
    if v is None:
        return True
    if isinstance(v, (list, dict, str)):
        return len(v) == 0 if not isinstance(v, str) else v.strip() == ""
    return False


def _answer_values(app):
    return {k: v for k, v in app.items() if k not in META_KEYS}


# --------------------------------------------------------------------------- #
# Verification / count signals (used for gating + display, not as weights)    #
# --------------------------------------------------------------------------- #

def signals_for(user):
    def _kyc():
        kv = getattr(user, "kyc_verification", None)
        if kv and (kv.status == "Approved" or kv.is_kyc_completed):
            return True
        ks = getattr(user, "kyc", None)
        return bool(ks and ks.status == "Approved")

    return {
        "email_verified": bool(getattr(user, "is_verify", False)),
        "profile_completed": bool(getattr(user, "profile_completed", False)),
        "kyc_approved": _safe(_kyc),
        "verified_referrals": _safe(
            lambda: ReferralCredit.objects.filter(referrer=user).count(), 0
        ),
        "approved_tasks": _safe(_approved_tasks_count(user), 0),
    }


def _approved_tasks_count(user):
    def _count():
        from fann.qualification.models import UserTask

        return UserTask.objects.filter(user=user, status=UserTask.APPROVED).count()

    return _count


# --------------------------------------------------------------------------- #
# The six components                                                           #
# --------------------------------------------------------------------------- #

def _profile_completion(user, sig, app):
    """How complete + verified the role profile is (0-20)."""
    pts = 0
    if sig["email_verified"]:
        pts += 6
    if sig["profile_completed"]:
        pts += 6
    answers = _answer_values(app)
    filled = sum(1 for v in answers.values() if not _empty(v))
    expected = EXPECTED_FIELDS.get(_norm_role(user), max(filled, 1))
    pts += round(8 * min(filled / expected, 1)) if expected else 0
    return min(pts, 20)


def _answer_quality(app):
    """Substance of onboarding answers — thoughtful vs one-word (0-20).

    Long free-text and richer multi-selects earn more; empty/one-word earn
    little. Schema-agnostic: grades each answer value on its own merit.
    """
    answers = _answer_values(app)
    if not answers:
        return 0
    per = []
    for v in answers.values():
        if isinstance(v, str):
            n = len(v.strip())
            per.append(3 if n > 120 else 2 if n > 40 else 1 if n > 0 else 0)
        elif isinstance(v, list):
            per.append(min(len(v), 3))
        else:
            per.append(1 if v not in (None, "") else 0)
    ratio = sum(per) / (3 * len(per))
    return round(20 * ratio)


def _grade(value, tiers):
    """Map a value to points via an ordered list of (predicate, points)."""
    for pred, pts in tiers:
        if pred(value):
            return pts
    return 0


def _strategic_fit(role, app):
    """How well the applicant matches FANN's mission / target market (0-20).

    Role-specific: rewards genuine, high-value intent (authenticatable work,
    real rosters, serious tickets, broad trusted reach) over thin applications.
    """
    a = _answer_values(app)

    def has(key):
        return not _empty(a.get(key))

    def lst(key):
        v = a.get(key)
        return v if isinstance(v, list) else []

    def length(key):
        v = a.get(key)
        return len(v.strip()) if isinstance(v, str) else 0

    pts = 0
    if role == "artist":
        auth = set(lst("authenticatable"))
        if auth & {"signed", "editioned", "certificate"}:
            pts += 8
        pts += {"ready": 6, "exploring": 3}.get(a.get("intent_to_list"), 0)
        if has("portfolio_link"):
            pts += 3
        if a.get("works_available") in {"6_20", "21_50", "gt_50"}:
            pts += 3
    elif role == "gallery":
        pts += {"gt_40": 6, "16_40": 6, "6_15": 3}.get(
            a.get("represented_artist_count"), 0
        )
        pts += {"gt_500": 5, "100_500": 5, "25_100": 3}.get(
            a.get("inventory_size"), 0
        )
        n = len(lst("partnership_interest"))
        pts += 5 if n >= 2 else 3 if n == 1 else 0
        if a.get("meeting_request") == "yes":
            pts += 4
    elif role == "collector":
        if has("budget_band"):
            pts += 5
        if set(lst("buying_motivation")) & {"investment", "passion", "support_artists"}:
            pts += 5
        if has("trust_concern"):
            pts += 5
        if len(lst("preferred_categories")) >= 2:
            pts += 5
    elif role == "curator":
        pts += _grade(length("professional_background"), [
            (lambda n: n > 80, 6), (lambda n: n > 30, 3)
        ])
        pts += _grade(length("network"), [
            (lambda n: n > 40, 5), (lambda n: n > 0, 2)
        ])
        if has("portfolio_link"):
            pts += 4
        if len(lst("themes_of_interest")) >= 2:
            pts += 5
    elif role == "investor":
        pts += {"vc": 5, "family_office": 5, "strategic": 5, "angel": 3}.get(
            a.get("investor_type"), 0
        )
        pts += {"gt_2m": 6, "500k_2m": 6, "100k_500k": 6, "25k_100k": 3}.get(
            a.get("ticket_band"), 0
        )
        pts += _grade(length("thesis"), [
            (lambda n: n > 80, 5), (lambda n: n > 0, 2)
        ])
        if a.get("briefing_request") == "yes":
            pts += 4
    elif role == "ambassador":
        pts += {"gt_250k": 6, "50k_250k": 6, "10k_50k": 6, "1k_10k": 3}.get(
            a.get("audience_size"), 0
        )
        n = len(lst("referral_capability"))
        pts += 5 if n >= 3 else 3 if n >= 1 else 0
        if len(lst("platform")) >= 2:
            pts += 4
        pts += _grade(length("content_outreach_ideas"), [
            (lambda n: n > 40, 5), (lambda n: n > 0, 2)
        ])
    return min(pts, 20)


def compute_components(user):
    """Return the six §3.1 components as a dict {key: earned_points}."""
    sig = signals_for(user)
    app = _app_data(user)
    role = _norm_role(user)
    rp = _safe(lambda: getattr(user, "role_profile", None), None)
    admin_override = min(getattr(rp, "admin_override_score", 0) or 0, 10) if rp else 0
    return {
        "profile_completion": _profile_completion(user, sig, app),
        "answer_quality": _answer_quality(app),
        "strategic_fit": _strategic_fit(role, app),
        "referral_quality": min(sig["verified_referrals"] * REFERRAL_PER, 15),
        "task_completion": min(sig["approved_tasks"] * TASK_PER, 15),
        "admin_override": admin_override,
    }, sig


def compute_readiness_score(user):
    """Return (score 0-100, signals dict, components dict)."""
    comps, sig = compute_components(user)
    score = min(sum(comps.values()), 100)
    return score, sig, comps


def completion_pct(user, signals=None):
    """Onboarding completion % — email verified, profile complete, answers given."""
    s = signals if signals is not None else signals_for(user)
    app = _app_data(user)
    checks = [
        s.get("email_verified"),
        s.get("profile_completed"),
        bool(_answer_values(app)),
    ]
    return round(sum(1 for c in checks if c) * 100 / len(checks))


# --------------------------------------------------------------------------- #
# Tier ladder (§3.3) — quality-gated, with the §3.4 manual-approval gate       #
# --------------------------------------------------------------------------- #

def tier_for(score, sig, role, admin_approved):
    """Map readiness + verification to a tier.

    - Hard roles (artist/gallery/investor) are NEVER auto-whitelisted: they
      stay Waitlisted until a human approves; then they tier by quality.
    - Verified Member requires a real, verified, sufficiently complete profile.
    - Priority / Founder's Circle require high readiness (and, in practice,
      strong fit — fit is already a third of the score).
    """
    role = (role or "").strip().lower()
    if role in HARD_ROLES and not admin_approved:
        return WhitelistEntry.WAITLISTED
    if not (sig.get("email_verified") and sig.get("profile_completed")):
        return WhitelistEntry.WAITLISTED
    if score >= 85:
        return WhitelistEntry.FOUNDERS_CIRCLE
    if score >= 60:
        return WhitelistEntry.PRIORITY_ACCESS
    return WhitelistEntry.VERIFIED_MEMBER
