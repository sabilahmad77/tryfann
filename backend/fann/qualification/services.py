"""
Qualification service functions: idempotent point awards, readiness recompute,
and verified-referral crediting.

Signal-safety: these never call `user.save()`. The cached `User.points`
projection is written with `.update()` (which does NOT emit post_save), so
calling these from a User post_save receiver cannot recurse.
"""
import logging

from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.utils import timezone

from fann.users.models import User, UserReferral
from fann.qualification import scoring
from fann.qualification.models import (
    AuditLog,
    PointsLedger,
    ReferralCredit,
    RoleProfile,
    WhitelistEntry,
)

logger = logging.getLogger(__name__)

# Concierge roles never see points/missions; their RoleProfile.track reflects it.
CONCIERGE_ROLES = {"Gallery", "Investor", "Organization"}

SIGNUP_POINTS = 20
KYC_POINTS = 30
REFERRAL_POINTS = 25
REFERRAL_MIN_COMPLETION = 50  # referee completion % required before crediting


def track_for_role(role):
    return RoleProfile.CONCIERGE if role in CONCIERGE_ROLES else RoleProfile.GAME


def ensure_qualification(user):
    """Idempotently create the RoleProfile + WhitelistEntry for a user."""
    role = getattr(user, "role", "") or ""
    rp, _ = RoleProfile.objects.get_or_create(
        user=user, defaults={"role": role, "track": track_for_role(role)}
    )
    WhitelistEntry.objects.get_or_create(user=user)
    return rp


def points_balance(user):
    return PointsLedger.objects.filter(user=user).aggregate(b=Sum("delta"))["b"] or 0


def award_points(user, delta, reason, dedupe_key=None, source="", metadata=None):
    """Append a ledger row (idempotent on dedupe_key) + sync cached User.points.

    Returns the new PointsLedger row, or None if it was a deduped no-op.
    """
    try:
        with transaction.atomic():
            if dedupe_key:
                entry, created = PointsLedger.objects.get_or_create(
                    dedupe_key=dedupe_key,
                    defaults={
                        "user": user,
                        "delta": delta,
                        "reason": reason,
                        "source": source,
                        "metadata": metadata or {},
                    },
                )
                if not created:
                    return None
            else:
                entry = PointsLedger.objects.create(
                    user=user,
                    delta=delta,
                    reason=reason,
                    source=source,
                    metadata=metadata or {},
                )
    except IntegrityError:
        return None
    # cached projection for the existing frontend (User.points is a CharField);
    # .update() avoids re-triggering the User post_save signal.
    User.objects.filter(pk=user.pk).update(points=str(points_balance(user)))
    return entry


def recompute(user):
    """Recompute readiness + completion + §3.3 tier; persist (no User.save())."""
    rp = ensure_qualification(user)
    score, sig, comps = scoring.compute_readiness_score(user)
    pct = scoring.completion_pct(user, sig)
    RoleProfile.objects.filter(pk=rp.pk).update(
        readiness_score=score, completion_pct=pct, score_updated_at=timezone.now()
    )
    we = WhitelistEntry.objects.get(user=user)
    tier = we.tier
    if not we.manual_override:
        # §3.4 manual-approval gate is enforced inside tier_for via admin_approved.
        tier = scoring.tier_for(
            score, sig, getattr(user, "role", ""), we.admin_approved
        )
        WhitelistEntry.objects.filter(pk=we.pk).update(tier=tier, score_at_review=score)
    return {
        "score": score,
        "completion_pct": pct,
        "tier": tier,
        "signals": sig,
        "components": comps,
    }


def credit_referral(referee):
    """Credit the referrer once the referee is verified + sufficiently complete.

    Verified-referrals-only + anti-fraud guards: referee must be email-verified
    and past the completion threshold; no self-referrals; one credit per referee
    (OneToOne). Idempotent.
    """
    if not getattr(referee, "is_verify", False):
        return None
    if ReferralCredit.objects.filter(referee=referee).exists():
        return None
    link = (
        UserReferral.objects.filter(referenced_to=referee)
        .select_related("referenced_by")
        .first()
    )
    if not link or not link.referenced_by:
        return None
    referrer = link.referenced_by
    if referrer.pk == referee.pk:  # self-referral guard
        return None
    if scoring.completion_pct(referee) < REFERRAL_MIN_COMPLETION:
        return None
    # Anti-fraud: same signup IP for referrer + referee ⇒ likely self-referral.
    referee_rp = RoleProfile.objects.filter(user=referee).first()
    referrer_rp = RoleProfile.objects.filter(user=referrer).first()
    referee_ip = (referee_rp.details or {}).get("signup_ip") if referee_rp else None
    referee_ua = (referee_rp.details or {}).get("signup_ua") if referee_rp else None
    referrer_ip = (referrer_rp.details or {}).get("signup_ip") if referrer_rp else None
    if referee_ip and referrer_ip and referee_ip == referrer_ip:
        AuditLog.objects.create(
            action="fraud_flag",
            target_type="referral",
            target_id=str(referee.pk),
            metadata={"reason": "referrer_referee_same_ip", "ip": referee_ip},
        )
        return None
    try:
        with transaction.atomic():
            credit = ReferralCredit.objects.create(
                referrer=referrer,
                referee=referee,
                points_awarded=REFERRAL_POINTS,
                referee_ip=referee_ip,
                referee_device=(referee_ua or "")[:128],
            )
    except IntegrityError:
        return None
    entry = award_points(
        referrer,
        REFERRAL_POINTS,
        "referral_credit",
        dedupe_key=f"referral:{referee.pk}",
        source="referral",
        metadata={"referee": referee.pk},
    )
    if entry:
        ReferralCredit.objects.filter(pk=credit.pk).update(ledger_entry=entry)
    recompute(referrer)
    return credit


# --- Tasks (Phase 5) --------------------------------------------------------

def tasks_for_user(user):
    """Active GAME-track tasks for this user's role, with completion state.

    Concierge users get an empty list — they never see missions (mandate §2).
    """
    from fann.qualification.models import Task, UserTask

    rp = ensure_qualification(user)
    if rp.track == RoleProfile.CONCIERGE:
        return []
    role = getattr(user, "role", "") or ""
    now = timezone.now()
    tasks = [
        t for t in Task.objects.filter(is_active=True)
        # §3 scheduling: only show modules whose publish time has arrived.
        if (t.publish_at is None or t.publish_at <= now)
        and (not t.roles or role in t.roles)
    ]
    # Concierge-tracked records carry 0 points and are never shown as missions.
    tasks = [t for t in tasks if t.points > 0]
    states = {
        ut.task_id: ut for ut in UserTask.objects.filter(user=user, task__in=tasks)
    }
    out = []
    for t in tasks:
        ut = states.get(t.id)
        out.append(
            {
                "key": t.key,
                "title_en": t.title_en,
                "title_ar": t.title_ar,
                "description_en": t.description_en,
                "description_ar": t.description_ar,
                "points": t.points,
                "verification": t.verification,
                "status": ut.status if ut else "available",
            }
        )
    return out


def complete_task(user, key, payload=None):
    """Record a task completion. Idempotent per (user, task).

    Instant tasks award points immediately; manual tasks go PENDING until an
    operator approves (approve_user_task). Returns (user_task, error_message).
    """
    from fann.qualification.models import Task, UserTask

    rp = ensure_qualification(user)
    if rp.track == RoleProfile.CONCIERGE:
        return None, "Tasks are not available for concierge accounts."
    try:
        task = Task.objects.get(key=key, is_active=True)
    except Task.DoesNotExist:
        return None, "Unknown task."
    role = getattr(user, "role", "") or ""
    if (task.roles and role not in task.roles) or task.points <= 0:
        return None, "This task is not available for your role."

    initial_status = (
        UserTask.APPROVED if task.verification == Task.INSTANT else UserTask.PENDING
    )
    ut, created = UserTask.objects.get_or_create(
        user=user,
        task=task,
        defaults={"status": initial_status, "payload": payload or {}},
    )
    if not created:
        return ut, None  # already recorded — idempotent no-op
    if ut.status == UserTask.APPROVED:
        entry = award_points(
            user,
            task.points,
            "task_completed",
            dedupe_key=f"task:{task.key}:{user.pk}",
            source="task",
            metadata={"task": task.key},
        )
        if entry:
            UserTask.objects.filter(pk=ut.pk).update(ledger_entry=entry)
        recompute(user)
    return ut, None


def _notify_tier_change(user, old_tier, new_tier):
    """Transactional email on whitelist promotion (console backend locally)."""
    from django.core.mail import send_mail

    from fann.qualification.models import WhitelistEntry

    labels = dict(WhitelistEntry.TIER_CHOICES)
    try:
        send_mail(
            subject=f"FANN: your founding status is now {labels.get(new_tier, new_tier)}",
            message=(
                f"Good news — your founding-cohort standing moved from "
                f"{labels.get(old_tier, old_tier)} to {labels.get(new_tier, new_tier)}.\n\n"
                "Sign in to see what's next: http://localhost:3000/dashboard"
            ),
            from_email=None,  # DEFAULT_FROM_EMAIL
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        logger.exception("tier-change email failed for user=%s", user.pk)


def approve_user_task(user_task, reviewer=None):
    """Operator approval of a PENDING manual task: award + recompute + email.

    Idempotent: approving an already-approved task is a no-op.
    """
    from django.utils import timezone as tz

    from fann.qualification.models import AuditLog, UserTask, WhitelistEntry

    if user_task.status == UserTask.APPROVED:
        return user_task
    old_tier = WhitelistEntry.objects.get(user=user_task.user).tier
    UserTask.objects.filter(pk=user_task.pk).update(
        status=UserTask.APPROVED, reviewed_by=reviewer, reviewed_at=tz.now()
    )
    if user_task.task.points > 0:
        entry = award_points(
            user_task.user,
            user_task.task.points,
            "task_completed",
            dedupe_key=f"task:{user_task.task.key}:{user_task.user_id}",
            source="task",
            metadata={"task": user_task.task.key},
        )
        if entry:
            UserTask.objects.filter(pk=user_task.pk).update(ledger_entry=entry)
    state = recompute(user_task.user)
    AuditLog.objects.create(
        actor=reviewer,
        action="task_approved",
        target_type="user_task",
        target_id=str(user_task.pk),
        metadata={"task": user_task.task.key, "user": user_task.user_id},
    )
    if state["tier"] != old_tier:
        _notify_tier_change(user_task.user, old_tier, state["tier"])
    user_task.refresh_from_db()
    return user_task


def reject_user_task(user_task, reviewer=None):
    from django.utils import timezone as tz

    from fann.qualification.models import AuditLog, UserTask

    UserTask.objects.filter(pk=user_task.pk).update(
        status=UserTask.REJECTED, reviewed_by=reviewer, reviewed_at=tz.now()
    )
    AuditLog.objects.create(
        actor=reviewer,
        action="task_rejected",
        target_type="user_task",
        target_id=str(user_task.pk),
        metadata={"task": user_task.task.key, "user": user_task.user_id},
    )
    user_task.refresh_from_db()
    return user_task
