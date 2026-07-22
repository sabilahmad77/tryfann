"""
Admin CRM API (Phase 6). Staff-only (DRF IsAdminUser => User.is_staff).

Read views power the /admin console in the TryFann frontend: KPI overview with
funnel + UTM attribution, role pipelines, a lead-scoring applicant list (+ CSV
export), the manual-review queue, and a referral tree. Write actions wrap the
Phase 5 services so audit/email behaviour stays in one place.
"""
import csv

from django.db.models import Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.text import slugify
from rest_framework.permissions import IsAdminUser

from fann.common.permissions import IsStaffSuperuser
from fann.common.response_mixins import BaseAPIView
from fann.users.models import KYCVerification, User, UserReferral
from fann.qualification import services
from fann.qualification.models import (
    Announcement,
    AnalyticsEvent,
    AuditLog,
    PointsLedger,
    RoleProfile,
    Task,
    UserTask,
    WhitelistEntry,
)


def _parse_dt(value):
    """Parse an ISO / datetime-local string into an aware datetime, or None."""
    if not value:
        return None
    dt = parse_datetime(value)
    if dt is None:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return dt

TIER_LABELS = dict(WhitelistEntry.TIER_CHOICES)


# H4: automated-test harness accounts (flow_/closed_/intdb_/fixed_/maillive_/
# pgreal_/… and +tf plus-addresses) pollute the production funnel and inflate
# the fraud counter. Exclude them from every admin view so counts + fraud
# signal reflect real users. (Reversible: a filter, not a delete.)
TEST_EMAIL_REGEX = (
    r"^(flow|flow2|closed|intdb|fixed|maillive|pgreal|staffonly|reftest)_"
)


def _exclude_test_accounts(qs, email_field="user__email"):
    return qs.exclude(**{f"{email_field}__iregex": TEST_EMAIL_REGEX}).exclude(
        **{f"{email_field}__icontains": "+tf"}
    )


def _test_account_user_ids():
    ids = set(
        User.objects.filter(email__iregex=TEST_EMAIL_REGEX).values_list("id", flat=True)
    )
    ids |= set(
        User.objects.filter(email__icontains="+tf").values_list("id", flat=True)
    )
    return ids


def _applicant_row(rp, pending_by_user, fraud_user_ids, balances, tiers):
    u = rp.user
    return {
        "id": u.id,
        "email": u.email,
        "name": f"{u.first_name or ''} {u.last_name or ''}".strip(),
        "role": rp.role,
        "track": rp.track,
        "readiness_score": rp.readiness_score,
        "completion_pct": rp.completion_pct,
        "tier": tiers.get(u.id, WhitelistEntry.WAITLISTED),
        "tier_label": TIER_LABELS.get(
            tiers.get(u.id, WhitelistEntry.WAITLISTED), "Waitlisted"
        ),
        "points": balances.get(u.id, 0),
        "email_verified": bool(u.is_verify),
        "profile_completed": bool(u.profile_completed),
        "pending_tasks": pending_by_user.get(u.id, 0),
        "fraud_flagged": u.id in fraud_user_ids,
        "joined": u.date_joined.isoformat() if u.date_joined else None,
    }


def _applicants_queryset(request):
    qs = _exclude_test_accounts(
        RoleProfile.objects.select_related("user")
    ).order_by("-readiness_score")
    role = request.query_params.get("role")
    track = request.query_params.get("track")
    tier = request.query_params.get("tier")
    q = request.query_params.get("q")
    if role:
        qs = qs.filter(role=role)
    if track:
        qs = qs.filter(track=track)
    if q:
        qs = qs.filter(user__email__icontains=q)
    rows = list(qs[:500])
    tiers = dict(
        WhitelistEntry.objects.filter(
            user_id__in=[r.user_id for r in rows]
        ).values_list("user_id", "tier")
    )
    if tier:
        rows = [r for r in rows if tiers.get(r.user_id) == tier]
    return rows, tiers


def _context_maps(rows):
    ids = [r.user_id for r in rows]
    pending = dict(
        UserTask.objects.filter(user_id__in=ids, status=UserTask.PENDING)
        .values("user_id")
        .annotate(n=Count("id"))
        .values_list("user_id", "n")
    )
    balances = dict(
        PointsLedger.objects.filter(user_id__in=ids)
        .values("user_id")
        .annotate(b=Sum("delta"))
        .values_list("user_id", "b")
    )
    fraud_ids = set()
    for log in AuditLog.objects.filter(action="fraud_flag"):
        try:
            fraud_ids.add(int(log.target_id))
        except (TypeError, ValueError):
            pass
    return pending, balances, fraud_ids


class AdminOverviewView(BaseAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # H4: exclude test-harness accounts so counts + fraud reflect real users.
        profiles = _exclude_test_accounts(RoleProfile.objects.all())
        by_role = dict(
            profiles.values("role").annotate(n=Count("id")).values_list("role", "n")
        )
        tiers = dict(
            WhitelistEntry.objects.values("tier")
            .annotate(n=Count("id"))
            .values_list("tier", "n")
        )
        total = profiles.count()
        verified = _exclude_test_accounts(
            User.objects.filter(is_verify=True, role_profile__isnull=False),
            email_field="email",
        ).count()
        _test_ids = _test_account_user_ids()
        landing_qs = AnalyticsEvent.objects.filter(name="landing_view")
        # UTM attribution: utm_source captured in landing_view props.
        utm = {}
        for ev in landing_qs:
            src = (ev.props or {}).get("utm_source") or "(direct)"
            utm[src] = utm.get(src, 0) + 1
        funnel = {
            "landing_views": landing_qs.count(),
            "roles_selected": AnalyticsEvent.objects.filter(
                name="signup_role_selected"
            ).count(),
            "signups_submitted": AnalyticsEvent.objects.filter(
                name="signup_submitted"
            ).count(),
            "accounts_created": total,
            "verified": verified,
        }
        return self.send_success_response(
            data={
                "totals": {
                    "applicants": total,
                    "verified": verified,
                    "pending_reviews": UserTask.objects.filter(
                        status=UserTask.PENDING
                    ).count(),
                    "fraud_flags": AuditLog.objects.filter(action="fraud_flag")
                    .exclude(target_id__in=[str(i) for i in _test_ids])
                    .count(),
                },
                "by_role": by_role,
                "tiers": {t: tiers.get(t, 0) for t in WhitelistEntry.TIER_ORDER},
                "funnel": funnel,
                "utm_sources": utm,
                "generated_at": timezone.now().isoformat(),
            }
        )


class AdminApplicantsView(BaseAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        rows, tiers = _applicants_queryset(request)
        pending, balances, fraud_ids = _context_maps(rows)
        return self.send_success_response(
            data={
                "applicants": [
                    _applicant_row(r, pending, fraud_ids, balances, tiers)
                    for r in rows
                ]
            }
        )


class AdminApplicantsCSVView(BaseAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        rows, tiers = _applicants_queryset(request)
        pending, balances, fraud_ids = _context_maps(rows)
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="applicants.csv"'
        fields = [
            "id", "email", "name", "role", "track", "readiness_score",
            "completion_pct", "tier", "points", "email_verified",
            "profile_completed", "pending_tasks", "fraud_flagged", "joined",
        ]
        writer = csv.DictWriter(response, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            writer.writerow(_applicant_row(r, pending, fraud_ids, balances, tiers))
        return response


class AdminApplicantActionView(BaseAPIView):
    """Whitelist console actions: prioritize / set_tier / clear_override / flag / recompute.

    ADM-01: these mutate a user's whitelist tier (the locked progression), so
    they require a superuser, not merely a staff viewer."""

    permission_classes = [IsStaffSuperuser]

    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return self.send_bad_request_response(message="Unknown applicant.")
        action = (request.data or {}).get("action")
        services.ensure_qualification(user)

        if action == "set_tier":
            tier = (request.data or {}).get("tier")
            if tier not in WhitelistEntry.TIER_ORDER:
                return self.send_bad_request_response(message="Unknown tier.")
            old = WhitelistEntry.objects.get(user=user).tier
            WhitelistEntry.objects.filter(user=user).update(
                tier=tier, manual_override=True
            )
            if tier != old:
                services._notify_tier_change(user, old, tier)
        elif action == "prioritize":
            old = WhitelistEntry.objects.get(user=user).tier
            WhitelistEntry.objects.filter(user=user).update(
                tier=WhitelistEntry.PRIORITY_ACCESS, manual_override=True
            )
            if old != WhitelistEntry.PRIORITY_ACCESS:
                services._notify_tier_change(
                    user, old, WhitelistEntry.PRIORITY_ACCESS
                )
        elif action == "approve":
            # §3.4: clear the hard-role gate so the applicant auto-tiers by
            # quality. (Promotion still respects the score thresholds.)
            old = WhitelistEntry.objects.get(user=user).tier
            WhitelistEntry.objects.filter(user=user).update(admin_approved=True)
            state = services.recompute(user)
            if state["tier"] != old:
                services._notify_tier_change(user, old, state["tier"])
        elif action == "unapprove":
            WhitelistEntry.objects.filter(user=user).update(admin_approved=False)
            services.recompute(user)
        elif action == "set_override_score":
            try:
                val = int((request.data or {}).get("score", 0))
            except (TypeError, ValueError):
                return self.send_bad_request_response(
                    message="score must be an integer 0-10"
                )
            val = max(0, min(val, 10))
            rp = services.ensure_qualification(user)
            RoleProfile.objects.filter(pk=rp.pk).update(admin_override_score=val)
            services.recompute(user)
        elif action == "clear_override":
            WhitelistEntry.objects.filter(user=user).update(manual_override=False)
            services.recompute(user)
        elif action == "flag":
            AuditLog.objects.create(
                actor=request.user,
                action="fraud_flag",
                target_type="user",
                target_id=str(user.pk),
                metadata={"reason": "manual_operator_flag"},
            )
        elif action == "recompute":
            services.recompute(user)
        else:
            return self.send_bad_request_response(message="Unknown action.")

        AuditLog.objects.create(
            actor=request.user,
            action=f"crm_{action}",
            target_type="user",
            target_id=str(user.pk),
            metadata={"via": "admin_api"},
        )
        we = WhitelistEntry.objects.get(user=user)
        return self.send_success_response(
            data={
                "id": user.pk,
                "tier": we.tier,
                "tier_label": TIER_LABELS.get(we.tier, we.tier),
                "manual_override": we.manual_override,
                "admin_approved": we.admin_approved,
            }
        )


class AdminPendingTasksView(BaseAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        pending = (
            UserTask.objects.filter(status=UserTask.PENDING)
            .select_related("user", "task")
            .order_by("created_at")[:200]
        )
        return self.send_success_response(
            data={
                "pending": [
                    {
                        "id": ut.id,
                        "user_id": ut.user_id,
                        "email": ut.user.email,
                        "role": getattr(ut.user, "role", ""),
                        "task": ut.task.key,
                        "task_title": ut.task.title_en,
                        "points": ut.task.points,
                        "payload": ut.payload,
                        "submitted": ut.created_at.isoformat(),
                    }
                    for ut in pending
                ]
            }
        )


class AdminReviewTaskView(BaseAPIView):
    # ADM-01: moderation decision (approve/reject a submission) → superuser only.
    permission_classes = [IsStaffSuperuser]

    def post(self, request, user_task_id):
        try:
            ut = UserTask.objects.select_related("task", "user").get(pk=user_task_id)
        except UserTask.DoesNotExist:
            return self.send_bad_request_response(message="Unknown submission.")
        decision = (request.data or {}).get("decision")
        if decision == "approve":
            ut = services.approve_user_task(ut, reviewer=request.user)
        elif decision == "reject":
            ut = services.reject_user_task(ut, reviewer=request.user)
        else:
            return self.send_bad_request_response(message="Unknown decision.")
        return self.send_success_response(data={"id": ut.id, "status": ut.status})


class AdminReferralTreeView(BaseAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        links = UserReferral.objects.select_related(
            "referenced_by", "referenced_to"
        ).exclude(referenced_by=None).exclude(referenced_to=None)
        tree = {}
        for link in links:
            ref = link.referenced_by
            node = tree.setdefault(
                ref.id,
                {"id": ref.id, "email": ref.email, "role": getattr(ref, "role", ""), "referees": []},
            )
            referee = link.referenced_to
            node["referees"].append(
                {
                    "id": referee.id,
                    "email": referee.email,
                    "role": getattr(referee, "role", ""),
                    "verified": bool(referee.is_verify),
                    "credited": hasattr(referee, "referral_credit_received"),
                }
            )
        roots = sorted(tree.values(), key=lambda n: -len(n["referees"]))
        return self.send_success_response(data={"referrers": roots})


class AdminPendingKYCView(BaseAPIView):
    """Pending KYC submissions awaiting human review."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        pending = (
            KYCVerification.objects.filter(status="Pending")
            .select_related("user")
            .order_by("created_at")[:200]
        )
        return self.send_success_response(
            data={
                "pending": [
                    {
                        "id": k.id,
                        "user_id": k.user_id,
                        "email": k.user.email,
                        "role": getattr(k.user, "role", ""),
                        "id_type": k.id_type,
                        "id_number": k.id_number,
                        "country": k.country,
                        "city": k.city,
                        "dob": k.dob.isoformat() if k.dob else None,
                        "submitted": k.created_at.isoformat() if k.created_at else None,
                    }
                    for k in pending
                ]
            }
        )


class AdminReviewKYCView(BaseAPIView):
    """Approve / reject a KYC submission. Approval fires the qualification
    KYC signal (awards KYC points + recompute) just like a real verification.

    ADM-01: an identity decision — gated on superuser, not just staff."""

    permission_classes = [IsStaffSuperuser]

    def post(self, request, kyc_id):
        try:
            kyc = KYCVerification.objects.select_related("user").get(pk=kyc_id)
        except KYCVerification.DoesNotExist:
            return self.send_bad_request_response(message="Unknown KYC submission.")
        decision = (request.data or {}).get("decision")
        if decision == "approve":
            kyc.status = "Approved"
            kyc.is_kyc_completed = True
            kyc.save()  # post_save → qualification_on_kyc_verification
        elif decision == "reject":
            kyc.status = "Rejected"
            kyc.is_kyc_completed = False
            kyc.save()
        else:
            return self.send_bad_request_response(message="Unknown decision.")
        AuditLog.objects.create(
            actor=request.user,
            action=f"kyc_{decision}",
            target_type="kyc",
            target_id=str(kyc.pk),
            metadata={"user": kyc.user_id},
        )
        return self.send_success_response(
            data={"id": kyc.id, "status": kyc.status}
        )


class AdminContentView(BaseAPIView):
    """Super-admin content authoring (§3): publish/schedule trust modules and
    FANN updates instead of hard-coding them. Scheduled items go live to game
    users once publish_at passes; completing a module updates Readiness."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        modules = Task.objects.all().order_by("sort_order", "id")
        anns = Announcement.objects.all()
        return self.send_success_response(
            data={
                "modules": [
                    {
                        "id": t.id,
                        "key": t.key,
                        "title_en": t.title_en,
                        "title_ar": t.title_ar,
                        "description_en": t.description_en,
                        "points": t.points,
                        "verification": t.verification,
                        "roles": t.roles,
                        "is_active": t.is_active,
                        "publish_at": t.publish_at.isoformat() if t.publish_at else None,
                        "published": t.is_published,
                        "completions": t.completions.count(),
                    }
                    for t in modules
                ],
                "announcements": [
                    {
                        "id": a.id,
                        "title_en": a.title_en,
                        "body_en": a.body_en,
                        "is_active": a.is_active,
                        "publish_at": a.publish_at.isoformat() if a.publish_at else None,
                        "published": a.is_published,
                    }
                    for a in anns
                ],
            }
        )

    def post(self, request):
        d = request.data or {}
        kind = d.get("type")
        if kind == "module":
            title = (d.get("title_en") or "").strip()
            if not title:
                return self.send_bad_request_response(message="title_en is required")
            key = (d.get("key") or slugify(title))[:64] or f"module-{Task.objects.count() + 1}"
            t, created = Task.objects.update_or_create(
                key=key,
                defaults={
                    "title_en": title,
                    "title_ar": d.get("title_ar", "") or "",
                    "description_en": d.get("description_en", "") or "",
                    "description_ar": d.get("description_ar", "") or "",
                    "points": int(d.get("points") or 0),
                    "verification": d.get("verification") or Task.INSTANT,
                    "roles": d.get("roles") or [],
                    "is_active": bool(d.get("is_active", True)),
                    "publish_at": _parse_dt(d.get("publish_at")),
                    "sort_order": int(d.get("sort_order") or 0),
                },
            )
            AuditLog.objects.create(
                actor=request.user,
                action="content_module_save",
                target_type="task",
                target_id=str(t.pk),
                metadata={"key": key, "created": created},
            )
            return self.send_success_response(
                data={"id": t.id, "key": t.key, "created": created, "published": t.is_published}
            )
        if kind == "announcement":
            title = (d.get("title_en") or "").strip()
            if not title:
                return self.send_bad_request_response(message="title_en is required")
            a = Announcement.objects.create(
                title_en=title,
                title_ar=d.get("title_ar", "") or "",
                body_en=d.get("body_en", "") or "",
                body_ar=d.get("body_ar", "") or "",
                is_active=bool(d.get("is_active", True)),
                publish_at=_parse_dt(d.get("publish_at")),
            )
            AuditLog.objects.create(
                actor=request.user,
                action="content_announcement_save",
                target_type="announcement",
                target_id=str(a.pk),
            )
            return self.send_success_response(data={"id": a.id, "published": a.is_published})
        return self.send_bad_request_response(
            message="type must be 'module' or 'announcement'"
        )
