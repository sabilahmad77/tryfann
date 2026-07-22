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
    # P0-4: referral loop conversion — a verified referral actually credited.
    from fann.qualification.models import AnalyticsEvent

    AnalyticsEvent.objects.create(
        user=referrer,
        name="referral_converted",
        props={"referee": referee.pk, "points": REFERRAL_POINTS},
    )
    return credit


# --- Tasks (Phase 5) --------------------------------------------------------

# QUIZ-2 anti-bruteforce: after this many consecutive quiz failures the user
# must wait QUIZ_COOLDOWN_MINUTES before submitting again.
QUIZ_MAX_ATTEMPTS_BEFORE_COOLDOWN = 3
QUIZ_COOLDOWN_MINUTES = 15


def readiness_delta_for_task(user):
    """The EXACT readiness a further approved task adds for this user now.

    SCORE-1 single-source rule: the number a mission advertises, the ledger
    line it writes, and the visible score movement must all be this value.
    Task completion is a capped component (anti-farming, plan SCORE-2), so
    once the cap is reached further tasks honestly advertise +0.
    """
    from fann.qualification.models import UserTask

    approved = UserTask.objects.filter(user=user, status=UserTask.APPROVED).count()
    cap = scoring.COMPONENT_WEIGHTS["task_completion"]
    per = scoring.TASK_PER
    current = min(cap, approved * per)
    return min(cap, (approved + 1) * per) - current


def _public_questions(task):
    """Quiz questions with the correct answers stripped (server-only)."""
    return [
        {
            "id": i,
            "q_en": q.get("q_en", ""),
            "q_ar": q.get("q_ar", ""),
            "options_en": q.get("options_en", []),
            "options_ar": q.get("options_ar", []),
        }
        for i, q in enumerate(task.questions or [])
    ]


def tasks_for_user(user):
    """Active GAME-track tasks for this user's role, with completion state.

    Concierge users get an empty list — they never see missions (mandate §2).
    Quiz questions ship WITHOUT their answers; `readiness_delta` is the
    server-computed score movement completing the task would produce now.
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
    delta_next = readiness_delta_for_task(user)
    out = []
    for t in tasks:
        ut = states.get(t.id)
        status = ut.status if ut else "available"
        # A failed quiz renders as available again (retryable).
        if status == UserTask.FAILED:
            status = "available"
        done = ut is not None and ut.status in (UserTask.APPROVED, UserTask.PENDING)
        out.append(
            {
                "key": t.key,
                "title_en": t.title_en,
                "title_ar": t.title_ar,
                "description_en": t.description_en,
                "description_ar": t.description_ar,
                # SCORE-1: advertise the ACTUAL readiness movement (0 once the
                # capped component is full) — never a legacy point figure.
                "readiness_delta": 0 if done else delta_next,
                "verification": t.verification,
                "status": status,
                "has_quiz": bool(t.questions),
                "questions": _public_questions(t),
                "attempts": ut.attempts if ut else 0,
            }
        )
    return out


def _grade_quiz(task, payload):
    """Grade submitted answers. Returns (passed, correct, total, error)."""
    questions = task.questions or []
    answers = (payload or {}).get("answers")
    if not isinstance(answers, list) or len(answers) != len(questions):
        return False, 0, len(questions), "Submit an answer for every question."
    correct = 0
    for q, a in zip(questions, answers):
        try:
            if int(a) == int(q.get("answer", -1)):
                correct += 1
        except (TypeError, ValueError):
            pass
    # Knowledge gate (QUIZ-1): every question must be answered correctly —
    # the whitelist is quality-gated, not participation-gated.
    return correct == len(questions), correct, len(questions), None


def complete_task(user, key, payload=None):
    """Record a task completion. Idempotent per (user, task).

    QUIZ-1: tasks with a question bank require correct answers — no quiz, no
    readiness. QUIZ-2: one award per (user, task), attempts are logged, and
    repeated failures trigger a cooldown. SCORE-1: the ledger entry written is
    the exact readiness delta the completion produced.

    Returns (user_task, error_message).
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

    now = timezone.now()
    ut = UserTask.objects.filter(user=user, task=task).first()
    # Anti-replay (QUIZ-2/SEC-01): a completed/pending task never re-awards.
    if ut and ut.status in (UserTask.APPROVED, UserTask.PENDING):
        return ut, None  # idempotent no-op — verified by test_task_replay

    # Knowledge gate (QUIZ-1) for tasks that carry a question bank.
    if task.questions:
        # Cooldown after repeated failures (anti-bruteforce).
        if (
            ut
            and ut.attempts >= QUIZ_MAX_ATTEMPTS_BEFORE_COOLDOWN
            and ut.last_attempt_at
            and (now - ut.last_attempt_at).total_seconds()
            < QUIZ_COOLDOWN_MINUTES * 60
        ):
            return None, (
                f"Too many attempts — try again in {QUIZ_COOLDOWN_MINUTES} minutes."
            )
        passed, correct, total, err = _grade_quiz(task, payload)
        if err:
            return None, err
        attempt_log = {
            "at": now.isoformat(),
            "correct": correct,
            "total": total,
            "passed": passed,
        }
        if not passed:
            if ut is None:
                ut = UserTask(user=user, task=task, payload={})
            ut.status = UserTask.FAILED
            ut.attempts = (ut.attempts or 0) + 1
            ut.last_attempt_at = now
            history = ut.payload.get("attempt_history", [])
            history.append(attempt_log)
            ut.payload["attempt_history"] = history[-10:]
            ut.save()
            return None, (
                f"{correct}/{total} correct — review the material and try again."
            )
        # Passed: fall through to award below, keeping the attempt trail.
        payload = dict(payload or {})
        payload["attempt_history"] = (
            (ut.payload.get("attempt_history", []) if ut else []) + [attempt_log]
        )[-10:]
        payload.pop("answers", None)  # never persist raw answers

    initial_status = (
        UserTask.APPROVED if task.verification == Task.INSTANT else UserTask.PENDING
    )
    if ut is None:
        ut = UserTask(user=user, task=task)
    ut.status = initial_status
    ut.payload = payload or {}
    ut.attempts = (ut.attempts or 0) + (1 if task.questions else 0)
    ut.last_attempt_at = now
    ut.save()

    if ut.status == UserTask.APPROVED:
        # SCORE-1: write the ACTUAL readiness movement to the ledger — the
        # same figure /me/tasks advertised — then recompute/persist.
        delta = readiness_delta_for_task_completion(user)
        entry = award_points(
            user,
            delta,
            "task_completed",
            dedupe_key=f"task:{task.key}:{user.pk}",
            source="task",
            metadata={"task": task.key, "readiness_delta": delta},
        )
        if entry:
            UserTask.objects.filter(pk=ut.pk).update(ledger_entry=entry)
        recompute(user)
    return ut, None


def readiness_delta_for_task_completion(user):
    """Delta for the task that was JUST approved (count includes it)."""
    from fann.qualification.models import UserTask

    approved = UserTask.objects.filter(user=user, status=UserTask.APPROVED).count()
    cap = scoring.COMPONENT_WEIGHTS["task_completion"]
    per = scoring.TASK_PER
    before = min(cap, max(approved - 1, 0) * per)
    return min(cap, approved * per) - before


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
        # SCORE-1: the ledger line is the exact readiness movement this
        # approval produced (capped component), same as instant tasks.
        delta = readiness_delta_for_task_completion(user_task.user)
        entry = award_points(
            user_task.user,
            delta,
            "task_completed",
            dedupe_key=f"task:{user_task.task.key}:{user_task.user_id}",
            source="task",
            metadata={"task": user_task.task.key, "readiness_delta": delta},
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


# --- DATA-01: single-source dashboard read (retires legacy /market_final stats) ---

def _num(v):
    """Parse a possibly-string numeric to float; junk -> 0.0 (Postgres-safe)."""
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


def dashboard_payload(user, base_url=None):
    """Role-aware dashboard stats — the ONE source of truth (audit DATA-01).

    Mirrors the honest fields the retired /market_final/dashboard_stats*
    endpoints returned, computed from real data. Numbers are integers
    (audit DATA-02); the referral funnel key is `conversion` (audit A5),
    with `conversation` kept only as a backward-compatible alias.
    """
    from django.db.models import Avg, Count, Sum
    from fann.users.models import UserReferral
    from fann.users.utils import unique_referral_code
    from fann.market_final.models import (
        ArtworkArtistCollection,
        ArtworkCollection,
        UserFollower,
    )

    rp = ensure_qualification(user)
    base = (base_url.rstrip("/") + "/ref/") if base_url else "https://www.tryfann.com/ref/"
    if not user.referral_code:
        user.referral_code = unique_referral_code()
        user.save(update_fields=["referral_code"])

    referral_count = UserReferral.objects.filter(referenced_by=user).count()
    pending = UserReferral.objects.filter(
        referenced_by=user, referenced_to__profile_completed=False
    ).count()
    conversion = UserReferral.objects.filter(
        referenced_by=user, referenced_to__profile_completed=True
    ).count()
    active_referral_count = UserReferral.objects.filter(
        referenced_by=user, referenced_to__is_active=True
    ).count()
    user_followers = UserFollower.objects.filter(follow_to=user).count()
    user_following = UserFollower.objects.filter(follow_by=user).count()
    artwork_count = ArtworkArtistCollection.objects.filter(user=user).count()
    collection_count = ArtworkCollection.objects.filter(user=user).count()

    data = {
        "referral_link": f"{base}{user.referral_code}",
        "is_referral_code": bool(user.referral_code),
        "total_referral_clicks": int(user.total_referral_clicks or 0),
        "referral_count": int(referral_count),
        "total_clicks": int(referral_count),
        "conversion": int(conversion),
        "conversation": int(conversion),  # deprecated alias (A5)
        "pending": int(pending),
        "user_followers": int(user_followers),
        "user_following": int(user_following),
        "artwork_count": int(artwork_count),
        "collection_count": int(collection_count),
        "profile_complete": bool(user.profile_completed),
        "track": rp.track,
    }

    if rp.track == RoleProfile.GAME:
        collected = ArtworkCollection.objects.filter(user=user).aggregate(
            v=Sum("purchase_value")
        )["v"] or 0
        listed = sum(
            _num(v)
            for v in ArtworkArtistCollection.objects.filter(user=user).values_list(
                "price", flat=True
            )
        )
        data["portfolio_value"] = round(float(collected) + listed, 2)

        rows = (
            ArtworkCollection.objects.exclude(category__isnull=True)
            .exclude(category__iexact="digital")
            .values("category")
            .annotate(avg_price=Avg("purchase_value"), total=Count("id"))
            .order_by("-total")
        )
        total_art = sum(r["total"] for r in rows)
        data["market_insight"] = [
            {
                "category": r["category"],
                "description": f"{r['total']} verified piece(s) in member collections",
                "avg_price": round(float(r["avg_price"] or 0), 2),
                "percentage": round(r["total"] / total_art * 100, 2),
            }
            for r in rows
        ] if total_art else []

        role = (getattr(user, "role", "") or "").lower()
        if role == "ambassador":
            data["active_referral_count"] = int(active_referral_count)
            data["social_stats"] = {
                "instagram_follower": getattr(user.instagram_follower, "range", None),
                "tiktok_follower": getattr(user.tiktok_follower, "range", None),
                "youtube_subscriber": getattr(user.youtube_subscribers, "range", None),
                "twitter_follower": getattr(user.twitter_follower, "range", None),
            }

    return data
