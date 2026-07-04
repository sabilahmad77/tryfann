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


def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") or None


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
