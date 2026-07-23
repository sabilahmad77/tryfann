"""
TryFann qualification spine (local-only app).

This layer sits on top of the existing `users` / `market_final` models and
adds the server-side qualification machinery the pre-launch mandate requires:
role profiles, an append-only points ledger, the §5.4 whitelist ladder,
verified-referral credits with anti-fraud snapshots, and audit/analytics
trails. It REFERENCES users.User and the existing verification/referral
signals rather than duplicating them.

Nothing here is exposed to investor/gallery (concierge) users as points or
missions — that gating lives in the API/serializer layer.
"""
from django.conf import settings
from django.db import models

from fann.common.model_mixins import TimestampMixin

USER = settings.AUTH_USER_MODEL


class RoleProfile(TimestampMixin):
    """Role-specific qualification data + server-computed readiness.

    Kept off the (already very large) User model. `details` holds the
    role-specific signup answers (e.g. artist medium / gallery roster size /
    investor ticket band) as JSON so we don't sprawl columns.
    """

    GAME = "game"
    CONCIERGE = "concierge"
    TRACK_CHOICES = [(GAME, "Game"), (CONCIERGE, "Concierge")]

    user = models.OneToOneField(
        USER, on_delete=models.CASCADE, related_name="role_profile"
    )
    role = models.CharField(max_length=50)  # mirror of User.role at signup
    track = models.CharField(max_length=20, choices=TRACK_CHOICES, default=GAME)
    details = models.JSONField(default=dict, blank=True)

    # Server-computed (0-100). Never trust a client-supplied value.
    readiness_score = models.PositiveSmallIntegerField(default=0)
    completion_pct = models.PositiveSmallIntegerField(default=0)
    score_updated_at = models.DateTimeField(null=True, blank=True)
    # §3.1 component 6: human judgement the model can't capture (0-10).
    admin_override_score = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f"RoleProfile<{self.user_id} {self.role} score={self.readiness_score}>"


class WhitelistEntry(TimestampMixin):
    """§5.4 whitelist standing — the source of truth for a user's tier.

    Distinct from the legacy market_final.Progression point tiers. Tier is
    recomputed server-side from readiness + verification unless an operator
    pins it (`manual_override`).
    """

    WAITLISTED = "waitlisted"
    VERIFIED_MEMBER = "verified_member"
    PRIORITY_ACCESS = "priority_access"
    FOUNDERS_CIRCLE = "founders_circle"
    TIER_CHOICES = [
        (WAITLISTED, "Waitlisted"),
        (VERIFIED_MEMBER, "Verified Member"),
        (PRIORITY_ACCESS, "Priority Access"),
        (FOUNDERS_CIRCLE, "Founder's Circle"),
    ]
    # Ordered for comparisons / progress display.
    TIER_ORDER = [WAITLISTED, VERIFIED_MEMBER, PRIORITY_ACCESS, FOUNDERS_CIRCLE]

    user = models.OneToOneField(
        USER, on_delete=models.CASCADE, related_name="whitelist_entry"
    )
    tier = models.CharField(max_length=32, choices=TIER_CHOICES, default=WAITLISTED)
    score_at_review = models.PositiveSmallIntegerField(default=0)
    position = models.PositiveIntegerField(null=True, blank=True)  # waitlist rank
    manual_override = models.BooleanField(default=False)  # operator-pinned tier
    # §3.4: hard-side roles (artist/gallery/investor) are never auto-whitelisted.
    # They stay Waitlisted until a human approves; then they auto-tier by quality.
    admin_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"WhitelistEntry<{self.user_id} {self.tier}>"


class PointsLedger(TimestampMixin):
    """Append-only points ledger. Balance = sum(delta). Never update/delete.

    `dedupe_key` makes awards idempotent (one row per logical event), so
    retries / double signals can't inflate a balance.
    """

    user = models.ForeignKey(
        USER, on_delete=models.CASCADE, related_name="points_ledger"
    )
    delta = models.IntegerField()
    reason = models.CharField(max_length=64)  # e.g. "signup", "kyc_verified"
    source = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    dedupe_key = models.CharField(
        max_length=128, unique=True, null=True, blank=True
    )

    class Meta:
        indexes = [models.Index(fields=["user", "created_at"])]
        ordering = ["-created_at"]

    def __str__(self):
        return f"PointsLedger<{self.user_id} {self.delta:+d} {self.reason}>"


class ReferralCredit(TimestampMixin):
    """Verified-referrals-only credit.

    Created ONLY after the referee is email-verified and has crossed the
    profile-completion threshold — guarding against signup-spam farming.
    One credit per referee (OneToOne). Anti-fraud snapshot captured for review.
    """

    referrer = models.ForeignKey(
        USER, on_delete=models.CASCADE, related_name="referral_credits_given"
    )
    referee = models.OneToOneField(
        USER, on_delete=models.CASCADE, related_name="referral_credit_received"
    )
    points_awarded = models.PositiveIntegerField(default=0)
    ledger_entry = models.ForeignKey(
        PointsLedger,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    # anti-fraud snapshot (referee at credit time)
    referee_ip = models.GenericIPAddressField(null=True, blank=True)
    referee_device = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return f"ReferralCredit<{self.referrer_id}->{self.referee_id} {self.points_awarded}>"


class AuditLog(TimestampMixin):
    """Operator/system action trail (feeds the Phase 6 admin CRM)."""

    actor = models.ForeignKey(
        USER, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    action = models.CharField(max_length=64)
    target_type = models.CharField(max_length=64, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"AuditLog<{self.action} {self.target_type}:{self.target_id}>"


class AnalyticsEvent(TimestampMixin):
    """Funnel analytics events (POST /api/qualification/analytics/events)."""

    user = models.ForeignKey(
        USER, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    name = models.CharField(max_length=80)
    props = models.JSONField(default=dict, blank=True)
    session_id = models.CharField(max_length=64, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["name", "created_at"])]

    def __str__(self):
        return f"AnalyticsEvent<{self.name} u={self.user_id}>"


class ConsentRecord(TimestampMixin):
    """P1-d — GDPR-provable, versioned consent.

    One row per consent decision (grant OR withdrawal) so the full history is
    auditable. `double_opt_in_confirmed` gates EU marketing until the emailed
    confirmation link is clicked. Rows are immutable history — a withdrawal is
    a NEW row with granted=False, not an edit.
    """

    ANALYTICS = "analytics"
    MARKETING = "marketing"
    TERMS = "terms"
    TYPE_CHOICES = [(ANALYTICS, "Analytics"), (MARKETING, "Marketing"), (TERMS, "Terms")]

    user = models.ForeignKey(
        USER, on_delete=models.CASCADE, null=True, blank=True, related_name="consents"
    )
    session_id = models.CharField(max_length=64, blank=True)  # pre-signup consent
    consent_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    version = models.CharField(max_length=20, default="1.0")
    granted = models.BooleanField(default=False)
    # EU marketing double opt-in: granted stays unconfirmed until the emailed
    # link is clicked.
    double_opt_in_required = models.BooleanField(default=False)
    double_opt_in_confirmed = models.BooleanField(default=False)
    confirm_token = models.CharField(max_length=64, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)  # anonymized
    source = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["consent_type", "created_at"])]

    def __str__(self):
        return f"ConsentRecord<{self.consent_type} granted={self.granted} u={self.user_id}>"


class Task(TimestampMixin):
    """A pre-launch qualification mission (mandate §5 task list).

    Tasks are GAME-track UI: concierge users (gallery/investor/org) never see
    missions. Concierge-targeted records (gallery_roster, book_onboarding_call)
    exist for admin-side tracking only and carry 0 points.
    """

    INSTANT = "instant"   # completing awards points immediately
    MANUAL = "manual"     # completion goes PENDING until an operator approves
    VERIFICATION_CHOICES = [(INSTANT, "Instant"), (MANUAL, "Manual review")]

    key = models.SlugField(max_length=64, unique=True)
    title_en = models.CharField(max_length=120)
    title_ar = models.CharField(max_length=120, blank=True)
    description_en = models.CharField(max_length=255, blank=True)
    description_ar = models.CharField(max_length=255, blank=True)
    points = models.PositiveIntegerField(default=0)
    verification = models.CharField(
        max_length=16, choices=VERIFICATION_CHOICES, default=INSTANT
    )
    # Roles this task applies to (e.g. ["Artist", "Curator"]); empty = all
    # GAME-track roles.
    roles = models.JSONField(default=list, blank=True)
    # QUIZ-1 (audit BRK-03/SEC-01): the knowledge gate. A list of
    # {q_en, q_ar, options_en[], options_ar[], answer} objects. The correct
    # index NEVER leaves the server; completion requires submitted answers
    # to pass. Empty list = no quiz (e.g. manual-review submissions).
    questions = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    # §3 content scheduling: a trust module is only visible to users once
    # publish_at has passed (null = immediately visible). Lets the super admin
    # schedule modules on a daily/weekly cadence instead of hard-coding them.
    publish_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"Task<{self.key} {self.points}pts {self.verification}>"

    @property
    def is_published(self):
        from django.utils import timezone
        return self.is_active and (
            self.publish_at is None or self.publish_at <= timezone.now()
        )


class Announcement(TimestampMixin):
    """A FANN update / news item the super admin publishes to game users.

    Like trust modules, it can be scheduled (publish_at) so updates go out on a
    daily/weekly cadence rather than being hard-coded.
    """

    title_en = models.CharField(max_length=140)
    title_ar = models.CharField(max_length=140, blank=True)
    body_en = models.TextField(blank=True)
    body_ar = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    publish_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-publish_at", "-created_at"]

    def __str__(self):
        return f"Announcement<{self.title_en[:40]}>"

    @property
    def is_published(self):
        from django.utils import timezone
        return self.is_active and (
            self.publish_at is None or self.publish_at <= timezone.now()
        )


class UserTask(TimestampMixin):
    """A user's completion of a Task. One row per (user, task) — idempotent."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FAILED = "failed"  # quiz attempted but not passed — retryable
    STATUS_CHOICES = [
        (PENDING, "Pending review"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
        (FAILED, "Quiz failed (retryable)"),
    ]

    user = models.ForeignKey(USER, on_delete=models.CASCADE, related_name="user_tasks")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="completions")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=PENDING)
    payload = models.JSONField(default=dict, blank=True)  # e.g. submission URL
    # QUIZ-2 anti-replay/anti-bruteforce bookkeeping: every quiz submission is
    # an attempt; 3 consecutive failures trigger a cooldown before retrying.
    attempts = models.PositiveSmallIntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        USER, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    ledger_entry = models.ForeignKey(
        PointsLedger, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        unique_together = [("user", "task")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"UserTask<{self.user_id} {self.task_id} {self.status}>"


class ConciergeRequest(TimestampMixin):
    """A concierge-track user's request to their advisor (plan ROLE-3).

    'Request a call' / 'Email your advisor' must actually send and be
    trackable by staff — never a silent button. Staff work the queue from
    the Django admin; the dashboard reflects the latest request's status.
    """

    CALL = "call"
    EMAIL = "email"
    KIND_CHOICES = [(CALL, "Call request"), (EMAIL, "Email intent")]

    NEW = "new"
    HANDLED = "handled"
    STATUS_CHOICES = [(NEW, "New"), (HANDLED, "Handled")]

    user = models.ForeignKey(
        USER, on_delete=models.CASCADE, related_name="concierge_requests"
    )
    kind = models.CharField(max_length=16, choices=KIND_CHOICES, default=CALL)
    message = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=NEW)
    handled_by = models.ForeignKey(
        USER, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    handled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"ConciergeRequest<{self.user_id} {self.kind} {self.status}>"
