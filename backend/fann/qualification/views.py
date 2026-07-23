"""
Qualification API.

Response envelope matches the rest of the app (BaseAPIView ->
{success,status_code,message,data}). Concierge roles (gallery / investor /
organization) never receive points / readiness score / ledger — only their
whitelist tier, completion %, and verification flags.
"""
from rest_framework.permissions import AllowAny, IsAuthenticated

from fann.common.response_mixins import BaseAPIView
from fann.qualification import scoring, services
from fann.qualification.models import (
    Announcement,
    AnalyticsEvent,
    PointsLedger,
    RoleProfile,
    WhitelistEntry,
)
from fann.qualification.serializers import (
    AnalyticsEventSerializer,
    RoleProfileUpdateSerializer,
)

TIER_LABELS = dict(WhitelistEntry.TIER_CHOICES)


def _anonymize_ip(ip):
    """P0-4: drop the last IPv4 octet / IPv6 suffix so we never store a full
    visitor IP for analytics (GDPR-friendly, mirrors GA's anonymize_ip)."""
    if not ip:
        return None
    if ":" in ip:  # IPv6 — keep first 3 hextets
        return ":".join(ip.split(":")[:3]) + "::"
    parts = ip.split(".")
    if len(parts) == 4:
        parts[-1] = "0"
        return ".".join(parts)
    return None


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return _anonymize_ip(xff.split(",")[0].strip())
    return _anonymize_ip(request.META.get("REMOTE_ADDR"))


def me_payload(user):
    """Qualification snapshot for `user`, gated for concierge roles."""
    state = services.recompute(user)  # always fresh
    rp = RoleProfile.objects.get(user=user)
    we = WhitelistEntry.objects.get(user=user)
    sig = state["signals"]
    payload = {
        "role": rp.role,
        "track": rp.track,
        "completion_pct": rp.completion_pct,
        "tier": we.tier,
        "tier_label": TIER_LABELS.get(we.tier, we.tier),
        "tier_order": WhitelistEntry.TIER_ORDER,
        "verification": {
            "email_verified": sig["email_verified"],
            "profile_completed": sig["profile_completed"],
            "kyc_approved": sig["kyc_approved"],
        },
    }
    # GAME track only — concierge users never see points/missions/score.
    if rp.track == RoleProfile.GAME:
        comps = state["components"]
        payload["points"] = services.points_balance(user)
        payload["readiness_score"] = rp.readiness_score
        payload["verified_referrals"] = sig["verified_referrals"]
        payload["signals"] = sig
        # The six §3.1 components, server-computed — the only honest source for
        # the Readiness Ledger's "what's earning / what's missing" breakdown.
        payload["components"] = [
            {"key": k, "earned": comps.get(k, 0), "max": scoring.COMPONENT_WEIGHTS[k]}
            for k in scoring.COMPONENT_ORDER
        ]
        payload["score_weights"] = dict(scoring.COMPONENT_WEIGHTS)
        payload["ledger"] = list(
            PointsLedger.objects.filter(user=user).values(
                "delta", "reason", "source", "created_at"
            )[:20]
        )
        # §3 FANN updates — published announcements from the super admin.
        payload["announcements"] = [
            {
                "title": a.title_en,
                "title_ar": a.title_ar,
                "body": a.body_en,
                "published_at": (
                    a.publish_at.isoformat() if a.publish_at else a.created_at.isoformat()
                ),
            }
            for a in Announcement.objects.filter(is_active=True)[:10]
            if a.is_published
        ][:5]
    return payload


class MeView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return self.send_success_response(data=me_payload(request.user))


class RoleProfileView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RoleProfileUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return self.send_bad_request_response(message=serializer.errors)
        user = request.user
        rp = services.ensure_qualification(user)
        data = serializer.validated_data
        updates = {}
        if "details" in data:
            merged = dict(rp.details or {})
            merged.update(data.get("details") or {})
            updates["details"] = merged
        if data.get("role"):
            updates["role"] = data["role"]
            updates["track"] = services.track_for_role(data["role"])
        if updates:
            RoleProfile.objects.filter(pk=rp.pk).update(**updates)
        return self.send_success_response(
            message="Profile updated", data=me_payload(user)
        )


class AnalyticsEventView(BaseAPIView):
    # Funnel events can be emitted before signup, so this is open. Attaches the
    # user only when an authenticated token is present.
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AnalyticsEventSerializer(data=request.data)
        if not serializer.is_valid():
            return self.send_bad_request_response(message=serializer.errors)
        data = serializer.validated_data
        AnalyticsEvent.objects.create(
            user=request.user if request.user.is_authenticated else None,
            name=data["name"],
            props=data.get("props") or {},
            session_id=data.get("session_id") or "",
            ip=_client_ip(request),
        )
        return self.send_success_response(message="ok", data={"recorded": True})


class MyTasksView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return self.send_success_response(
            data={"tasks": services.tasks_for_user(request.user)}
        )


class CompleteTaskView(BaseAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, key):
        payload = request.data if isinstance(request.data, dict) else {}
        user_task, error = services.complete_task(request.user, key, payload=payload)
        if error:
            return self.send_bad_request_response(message=error)
        # SCORE-1: return the exact readiness the completion earned so the UI
        # shows the same number the ledger recorded and the score moved by.
        user_task.refresh_from_db()
        earned = user_task.ledger_entry.delta if user_task.ledger_entry else 0
        return self.send_success_response(
            data={
                "task": key,
                "status": user_task.status,
                "earned": earned,
                "me": me_payload(request.user),
            }
        )


class ConciergeRequestView(BaseAPIView):
    """Concierge advisor requests (plan ROLE-3, audit 'silent buttons').

    POST records a call/email request, best-effort notifies the concierge
    inbox, and returns the open-request state so the dashboard can show a
    real status instead of a fire-and-forget mailto.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from fann.qualification.models import ConciergeRequest

        latest = (
            ConciergeRequest.objects.filter(user=request.user)
            .values("kind", "status", "created_at")
            .first()
        )
        return self.send_success_response(data={"latest": latest})

    def post(self, request):
        import logging

        from fann.qualification.models import ConciergeRequest

        kind = (request.data or {}).get("kind", ConciergeRequest.CALL)
        if kind not in (ConciergeRequest.CALL, ConciergeRequest.EMAIL):
            kind = ConciergeRequest.CALL
        message = str((request.data or {}).get("message", ""))[:500]

        # One OPEN call request at a time — repeat clicks don't spam staff.
        existing = ConciergeRequest.objects.filter(
            user=request.user, kind=kind, status=ConciergeRequest.NEW
        ).first()
        if existing:
            req = existing
            created = False
        else:
            req = ConciergeRequest.objects.create(
                user=request.user, kind=kind, message=message
            )
            created = True

        if created:
            # Best-effort advisor notification; never block the request on mail.
            try:
                from django.core.mail import send_mail

                send_mail(
                    subject=f"Concierge {kind} request — {request.user.email}",
                    message=(
                        f"User: {request.user.email} ({request.user.role})\n"
                        f"Kind: {kind}\nMessage: {message or '—'}\n"
                        "Handle it from the staff admin (Concierge requests)."
                    ),
                    from_email=None,
                    recipient_list=["concierge@tryfann.com"],
                    fail_silently=True,
                )
            except Exception:  # noqa: BLE001
                logging.getLogger(__name__).warning(
                    "concierge notify failed", exc_info=True
                )

        return self.send_success_response(
            data={
                "kind": req.kind,
                "status": req.status,
                "created": created,
                "created_at": req.created_at.isoformat(),
            }
        )


class MeDashboardView(BaseAPIView):
    """Single-source dashboard stats (audit DATA-01).

    Replaces the legacy /market_final/dashboard_stats(+_gallery/_ambassador).
    The dashboard now reads tier/score from /qualification/me and stats from
    here — one namespace, one source of truth.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        url = request.query_params.get("url")
        return self.send_success_response(
            data=services.dashboard_payload(request.user, base_url=url)
        )


class MeArtworksView(BaseAPIView):
    """The signed-in user's artwork pieces (audit DATA-01: qualification namespace).

    Read alias over the market_final ArtworkArtistCollection resource so the
    dashboard mount never touches /market_final/*. Create/edit/delete stay on
    the market_final resource (mutations, not mount reads)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from fann.market_final.models import ArtworkArtistCollection
        from fann.market_final.serializers import ArtworkArtistCollectionSerializer

        qs = ArtworkArtistCollection.objects.filter(user=request.user).order_by("-id")
        data = ArtworkArtistCollectionSerializer(
            qs, many=True, context={"request": request}
        ).data
        return self.send_success_response(data=data)


class MeCollectionView(BaseAPIView):
    """The signed-in user's collected pieces (audit DATA-01)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from fann.market_final.models import ArtworkCollection
        from fann.market_final.serializers import ArtworkCollectionSerializer

        qs = ArtworkCollection.objects.filter(user=request.user).order_by("-id")
        data = ArtworkCollectionSerializer(
            qs, many=True, context={"request": request}
        ).data
        return self.send_success_response(data=data)


class MeRosterView(BaseAPIView):
    """A gallery's artist roster (audit DATA-01)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from fann.market_final.models import ArtistRoaster
        from fann.market_final.serializers import ArtistRoasterSerializer

        qs = ArtistRoaster.objects.filter(user=request.user).order_by("-id")
        data = ArtistRoasterSerializer(
            qs, many=True, context={"request": request}
        ).data
        return self.send_success_response(data=data)


class ConsentView(BaseAPIView):
    """P1-d — GDPR consent: record, list, and confirm (double opt-in).

    POST records a grant/withdrawal as a new immutable row. EU marketing grants
    require a double opt-in: the row is stored unconfirmed and a confirmation
    link is emailed; GET/export returns the provable consent history.
    """

    permission_classes = [AllowAny]  # consent can be captured pre-signup

    def get(self, request):
        from fann.qualification.models import ConsentRecord

        qs = ConsentRecord.objects.all()
        if request.user.is_authenticated:
            qs = qs.filter(user=request.user)
        else:
            sid = request.query_params.get("session_id") or ""
            qs = qs.filter(session_id=sid) if sid else qs.none()
        data = list(
            qs.values(
                "consent_type", "granted", "version", "double_opt_in_confirmed",
                "source", "created_at",
            )[:200]
        )
        # This list IS the exportable consent proof (DSAR-ready).
        return self.send_success_response(data={"consents": data})

    def post(self, request):
        import secrets

        from fann.qualification.models import ConsentRecord

        body = request.data if isinstance(request.data, dict) else {}
        ctype = body.get("consent_type")
        if ctype not in (ConsentRecord.ANALYTICS, ConsentRecord.MARKETING, ConsentRecord.TERMS):
            return self.send_bad_request_response(message="Invalid consent_type.")
        granted = bool(body.get("granted"))
        version = str(body.get("version") or "1.0")
        # EU marketing grants need a confirmed double opt-in before they count.
        needs_double = ctype == ConsentRecord.MARKETING and granted
        token = secrets.token_urlsafe(24) if needs_double else ""
        rec = ConsentRecord.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=str(body.get("session_id") or ""),
            consent_type=ctype,
            granted=granted,
            version=version,
            double_opt_in_required=needs_double,
            double_opt_in_confirmed=not needs_double and granted,
            confirm_token=token,
            ip=_client_ip(request),  # already anonymized
            source=str(body.get("source") or "web")[:60],
        )
        if needs_double and request.user.is_authenticated:
            try:
                from django.core.mail import send_mail

                send_mail(
                    subject="TryFANN — confirm your email preferences",
                    message=(
                        "Please confirm you'd like to receive TryFANN updates by "
                        f"opening this link:\n\nhttps://www.tryfann.com/consent/confirm?token={token}"
                    ),
                    from_email=None,
                    recipient_list=[request.user.email],
                    fail_silently=True,
                )
            except Exception:  # noqa: BLE001
                pass
        return self.send_success_response(
            data={
                "id": rec.id,
                "consent_type": rec.consent_type,
                "granted": rec.granted,
                "double_opt_in_required": rec.double_opt_in_required,
                "double_opt_in_confirmed": rec.double_opt_in_confirmed,
            }
        )


class ConsentConfirmView(BaseAPIView):
    """P1-d — confirm an EU marketing double opt-in via the emailed token."""

    permission_classes = [AllowAny]

    def post(self, request):
        from fann.qualification.models import ConsentRecord

        token = (request.data or {}).get("token") or request.query_params.get("token")
        if not token:
            return self.send_bad_request_response(message="Missing token.")
        rec = ConsentRecord.objects.filter(
            confirm_token=token, double_opt_in_required=True
        ).first()
        if not rec:
            return self.send_bad_request_response(message="Invalid or used token.")
        rec.double_opt_in_confirmed = True
        rec.confirm_token = ""
        rec.save(update_fields=["double_opt_in_confirmed", "confirm_token"])
        return self.send_success_response(data={"confirmed": True})


class MeErasureView(BaseAPIView):
    """Enh-3 — GDPR self-service erasure (right to be forgotten).

    An authenticated user can erase their own account without contacting
    support. This is a hard-confirmed soft delete + PII scrub: the row is
    retained (referential integrity, financial/audit records) but deactivated,
    de-identified, and de-verified — the same end state as the operator purge
    command, applied to the caller only. The action is logged for compliance.
    Superusers are refused (protects the admin account from self-lockout).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone

        from fann.qualification.models import AuditLog, ConsentRecord

        user = request.user
        if user.is_superuser:
            return self.send_bad_request_response(
                message="Admin accounts cannot self-erase. Contact another superuser."
            )
        body = request.data if isinstance(request.data, dict) else {}
        # Require an explicit, unambiguous confirmation to prevent accidents.
        confirm = str(body.get("confirm") or "").strip().upper()
        if confirm != "ERASE":
            return self.send_bad_request_response(
                message='Erasure requires {"confirm": "ERASE"}. This cannot be undone.'
            )

        uid = user.pk
        # De-identify PII while keeping the row for integrity/audit.
        user.first_name = ""
        user.last_name = ""
        user.email = f"erased+{uid}@deleted.tryfann.invalid"
        user.phone_number = None
        user.address = None
        user.bio = None
        user.about = None
        user.location = None
        user.title = None
        user.profile_image = None
        user.banner = None
        user.socials = []
        user.website = []
        user.interests = []
        user.application_data = {}
        user.instagram_handle = None
        user.is_active = False
        user.is_verify = False
        user.is_deleted = True
        user.set_unusable_password()
        user.save()

        # Withdraw any standing consents as fresh immutable rows.
        for ctype in (ConsentRecord.ANALYTICS, ConsentRecord.MARKETING):
            ConsentRecord.objects.create(
                user=None,  # detach from the now-erased identity
                consent_type=ctype,
                granted=False,
                source="self_erasure",
                ip=_client_ip(request),
            )
        AuditLog.objects.create(
            actor=None,
            action="self_erasure",
            target_type="user",
            target_id=str(uid),
            metadata={"at": timezone.now().isoformat()},
        )
        return self.send_success_response(
            message="Your account and personal data have been erased.",
            data={"erased": True},
        )


class FoundingStatusView(BaseAPIView):
    """P1-11 / P1-12 — truthful founding-tier scarcity + the caller's standing.

    Returns, for each tier, the operator-set cap and the REAL number of members
    currently in it (never a fabricated 'only N left'), plus — when
    authenticated — the caller's own tier, application status, and waitlist
    position. Open so the landing page can show honest capacity pre-signup.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        from django.db.models import Count

        from fann.qualification.models import FoundingTierCap, WhitelistEntry

        counts = {
            row["tier"]: row["n"]
            for row in WhitelistEntry.objects.values("tier").annotate(n=Count("id"))
        }
        caps = {c.tier: c for c in FoundingTierCap.objects.all()}
        tiers = []
        for tier, label in WhitelistEntry.TIER_CHOICES:
            cap_obj = caps.get(tier)
            cap = cap_obj.cap if cap_obj else 0
            filled = int(counts.get(tier, 0))
            tiers.append({
                "tier": tier,
                "label": label,
                "cap": cap,  # 0 = uncapped
                "filled": filled,
                "remaining": (max(0, cap - filled) if cap else None),
                "is_full": bool(cap) and filled >= cap,
            })
        data = {"tiers": tiers}
        if request.user.is_authenticated:
            we = WhitelistEntry.objects.filter(user=request.user).first()
            if we:
                data["me"] = {
                    "tier": we.tier,
                    "tier_label": TIER_LABELS.get(we.tier, we.tier),
                    "application_status": we.application_status,
                    "status_label": dict(WhitelistEntry.STATUS_CHOICES).get(
                        we.application_status, we.application_status
                    ),
                    "position": we.position,
                    "status_updated_at": we.status_updated_at,
                }
        return self.send_success_response(data=data)


class CuratorInvitationAcceptView(BaseAPIView):
    """P1-9 — accept a curator invitation and become a Curator.

    The caller (authenticated) submits the single-use token. If it is valid
    (not revoked, not already used, not expired) the invitation is consumed and
    the user's role is promoted to Curator. Logged for audit.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone

        from fann.qualification.models import AuditLog, CuratorInvitation

        body = request.data if isinstance(request.data, dict) else {}
        token = str(body.get("token") or "").strip()
        if not token:
            return self.send_bad_request_response(message="Missing invitation token.")
        inv = CuratorInvitation.objects.filter(token=token).first()
        if not inv or not inv.is_valid():
            return self.send_bad_request_response(
                message="This invitation is invalid, already used, revoked, or expired."
            )
        user = request.user
        inv.accepted_by = user
        inv.accepted_at = timezone.now()
        inv.save(update_fields=["accepted_by", "accepted_at"])
        old_role = user.role
        user.role = "Curator"
        user.save(update_fields=["role"])
        rp = services.ensure_qualification(user)
        RoleProfile.objects.filter(user=user).update(
            role="Curator", track=services.track_for_role("Curator")
        )
        AuditLog.objects.create(
            actor=user,
            action="curator_invitation_accept",
            target_type="user",
            target_id=str(user.pk),
            metadata={"invitation": inv.pk, "old_role": old_role},
        )
        return self.send_success_response(
            message="You are now a Curator.", data=me_payload(user)
        )
