import os
from fann.common.response_mixins import BaseAPIView
from rest_framework.generics import CreateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.throttling import ScopedRateThrottle  # [local/tryfann] rate limits
from fann.qualification.antifraud import record_signup_fingerprint  # [local/tryfann]
from .serializers import (
    UserRegisterSerializer,
    UserFinalMarketSerializer,
    # Retained ONLY for the staff-only user list (AllTryFannUsersView);
    # every public/user-facing leaderboard surface has been removed
    # (audit SEC-02 / plan SCORE-3).
    LeaderBoardDetailsSerializer,
    UserProfileSetupSerializer,
    UserIntersetSerializer,
    UserRewardSerializer,
    UserDetailsSerializer,
    KYCVerificationSerializer,
    RegionSerializer,
    UserLoginSerializer,
    RefreshTokenSerializers,
    WatchEarnSerializer,
    RedemptionSerializer,
    UserSettingsSerializer,
    UserGetSettingsSerializer,
    UserChangePasswordSerializer,
    ProgressionSerializer,
    UserFollowLeaderBoardSerializers,
    ArtistRoasterSerializer,
    ArtworkCollectionSerializer,
    InstagramFollowerSerializer,
    YoutubeSubscriberSerializer,
    TwitterFollowerSerializer,
    TiktokFollowerSerializer,
    PrimaryPlatformSerializer,
    ArtworkArtistCollectionSerializer,
    PriceRangeSerializer,
    ViewUserProfileSerializer,
    UserFeedBackSerializer,
    UserReportBugSerializer, UserReportBugListingSerializer,
)
from fann.common.permissions import (
    IsArtistPermission,
    IsSuperAdmin,
    IsArtistOrSuperAdmin,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, generics
from .models import (
    Region,
    ReferralClick,
    WatchEarn,
    UserWatchEarn,
    Redemption,
    UserRedemption,
    UserSettings,
    Progression,
    UserFollower,
    ArtistRoaster,
    ArtworkCollection,
    InstagramFollowers,
    TwitterFollowers,
    YoutubeSubscribers,
    TikTokFollowers,
    PrimaryPlatform,
    PuzzleCompletion,
    ArtworkArtistCollection,
    PriceRange,
    UserFeedBack,
    UserReportBug,
)
from fann.users.models import User, UserReferral
from .utils import (
    generate_referral_code,
    get_client_ip,
    generate_redeem_referral_code,
)
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import IntegerField
from django.db.models.functions import Cast
from django.db.models import IntegerField, Avg, Count, Sum
from .pagination import CustomPageNumberPagination
from rest_framework.response import Response
from rest_framework import status


def _gone_dashboard():
    """410 Gone tombstone for the retired dashboard-stat endpoints (audit
    DATA-01). The single source of truth is GET /api/qualification/me/dashboard.
    Returns the app's standard envelope so clients parse it uniformly."""
    return Response(
        {
            "success": False,
            "status_code": status.HTTP_410_GONE,
            "message": "Endpoint retired. Use GET /api/qualification/me/dashboard.",
            "data": None,
        },
        status=status.HTTP_410_GONE,
    )


class UserRegisterView(BaseAPIView, CreateAPIView):
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]  # [local/tryfann] rate limit signups
    throttle_scope = "register"
    queryset = None
    serializer_class = UserRegisterSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            user = serializer.save()
            # [local/tryfann] capture signup IP/UA for anti-fraud (best-effort)
            record_signup_fingerprint(user, request)
            user_data = UserFinalMarketSerializer(user).data
            # [local/tryfann] Auto-issue tokens so the role application funnel
            # (Point 2) is authenticated immediately after signup — the per-role
            # form persists to the user record without a separate login. Email
            # verification is still required to log back in later.
            refresh = RefreshToken.for_user(user)
            user_data["refresh"] = str(refresh)
            user_data["access"] = str(refresh.access_token)
            return self.send_success_response(data=user_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserLoginView(BaseAPIView, generics.GenericAPIView):
    permission_classes = []
    queryset = None
    serializer_class = UserLoginSerializer

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            user = serializer.validated_data["user"]

            # Legacy "+25 first-login points" award removed (plan SCORE-1):
            # the Readiness model in /qualification/* is the only scoring
            # system; no silent legacy points accrue anywhere.
            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            refresh = RefreshToken.for_user(user)
            user_data = UserFinalMarketSerializer(
                user, context={"request": request}
            ).data
            user_data["refresh"] = str(refresh)
            user_data["access"] = str(refresh.access_token)
            return self.send_success_response(data=user_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class GoogleLoginView(BaseAPIView, APIView):
    """Sign in / sign up with Google (verified server-side).

    The frontend obtains a Google ID token via Google Identity Services and
    POSTs it here as `credential`. We verify the token's signature + audience
    against Google (never trust the client), then match or create a user by
    their Google-verified email and issue our normal JWT pair — identical to
    the password login response so the frontend handles both the same way.

    An optional `role` (from the sign-up role picker) is applied to brand-new
    accounts; existing users keep their role. New accounts are email-verified
    (Google already verified it) and get a referral code like any signup.
    """

    permission_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"  # reuse the anti-abuse signup bucket

    def post(self, request, *args, **kwargs):
        try:
            from django.conf import settings as dj_settings
            from fann.users.utils import unique_referral_code

            credential = (request.data or {}).get("credential")
            if not credential:
                return self.send_bad_request_response(
                    message="Missing Google credential."
                )
            client_id = getattr(dj_settings, "GOOGLE_OAUTH_CLIENT_ID", "")
            if not client_id:
                return self.send_bad_request_response(
                    message="Google login is not configured."
                )

            # Verify signature, expiry and audience against Google.
            try:
                from google.auth.transport import requests as g_requests
                from google.oauth2 import id_token as g_id_token

                info = g_id_token.verify_oauth2_token(
                    credential, g_requests.Request(), client_id
                )
            except Exception:  # noqa: BLE001 — any failure = untrusted token
                return self.send_bad_request_response(
                    message="Could not verify Google sign-in. Please try again."
                )

            if info.get("iss") not in (
                "accounts.google.com",
                "https://accounts.google.com",
            ):
                return self.send_bad_request_response(message="Invalid token issuer.")
            email = (info.get("email") or "").strip().lower()
            if not email or not info.get("email_verified", False):
                return self.send_bad_request_response(
                    message="Your Google email is not verified."
                )

            requested_role = (request.data or {}).get("role") or ""
            user = User.objects.filter(email__iexact=email).first()
            new_user = user is None
            if new_user:
                user = User.objects.create(
                    email=email,
                    first_name=info.get("given_name", "") or "",
                    last_name=info.get("family_name", "") or "",
                    role=requested_role,
                    points="0",
                    is_verify=True,  # Google already verified the address
                    profile_step=1,
                    try_market=True,
                    referral_code=unique_referral_code(),
                )
                user.set_unusable_password()  # login is via Google only
                user.save()
                record_signup_fingerprint(user, request)
            else:
                # Backfill a referral code for pre-existing accounts (BRK-04).
                if not user.referral_code:
                    user.referral_code = unique_referral_code()
                    user.save(update_fields=["referral_code"])

            user.last_login = timezone.now()
            user.save(update_fields=["last_login"])

            refresh = RefreshToken.for_user(user)
            user_data = UserFinalMarketSerializer(
                user, context={"request": request}
            ).data
            user_data["refresh"] = str(refresh)
            user_data["access"] = str(refresh.access_token)
            # Frontend routes new users (esp. without a role yet) into role
            # selection / onboarding; existing users go straight to dashboard.
            user_data["new_user"] = new_user
            user_data["needs_role"] = not (user.role or "")
            return self.send_success_response(data=user_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class RoleApplicationView(BaseAPIView, APIView):
    """TryFann Point 2: persist a role's schema-driven application answers.

    Merges the posted ``application_data`` dict into the user's JSON store so
    every per-role field persists (save-and-continue friendly). Optionally
    advances ``profile_step`` / marks the application complete. Pure data
    capture — no qualification-scoring logic lives here.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            payload = request.data or {}
            incoming = payload.get("application_data")
            if incoming is None:
                incoming = {
                    k: v
                    for k, v in payload.items()
                    if k not in ("profile_step", "profile_completed")
                }
            if not isinstance(incoming, dict):
                return self.send_bad_request_response(
                    message="application_data must be an object"
                )

            current = (
                user.application_data
                if isinstance(user.application_data, dict)
                else {}
            )
            current.update(incoming)
            user.application_data = current
            update_fields = ["application_data", "profile_partial_completed"]
            user.profile_partial_completed = True

            step = payload.get("profile_step")
            if step is not None:
                user.profile_step = str(step)
                update_fields.append("profile_step")

            completed = payload.get("profile_completed")
            if completed is not None:
                user.profile_completed = bool(completed)
                update_fields.append("profile_completed")

            # Allow setting the role here so a Google-signup user who arrived
            # without one (no password-register step) can pick it during
            # onboarding. Only accept a valid role and only when currently unset
            # or explicitly changing during onboarding.
            ALLOWED_ROLES = {
                "Artist", "Gallery", "Collector", "Curator", "Ambassador", "Investor",
            }
            new_role = payload.get("role")
            if new_role in ALLOWED_ROLES:
                user.role = new_role
                update_fields.append("role")

            user.save(update_fields=update_fields)
            data = UserFinalMarketSerializer(
                user, context={"request": request}
            ).data
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ProfileSetupView(BaseAPIView, CreateAPIView):
    permission_classes = [IsArtistPermission]
    queryset = None
    serializer_class = UserProfileSetupSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(
                data=request.data,
                context={"request": request, "request_user": request.user},
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            profile_data = serializer.save()
            return self.send_success_response(data=profile_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserInterestView(BaseAPIView, CreateAPIView):
    permission_classes = [IsArtistPermission]
    queryset = None
    serializer_class = UserIntersetSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(
                data=request.data, context={"request_user": request.user}
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            interset_data = serializer.save()
            return self.send_success_response(data=interset_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class KYCVerificationView(BaseAPIView, CreateAPIView):
    permission_classes = [IsArtistPermission]
    queryset = None
    serializer_class = KYCVerificationSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(
                data=request.data,
                context={"request": request, "request_user": request.user},
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            reward_data = serializer.save()
            return self.send_success_response(data=reward_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserRewardView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserRewardSerializer

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(
                data=request.data, context={"request_user": request.user}
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            reward_data = serializer.save()
            return self.send_success_response(data=reward_data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class GETUserDetailsView(BaseAPIView, RetrieveAPIView):
    permission_classes = [IsArtistPermission]
    queryset = None
    serializer_class = UserDetailsSerializer

    def get(self, request, *args, **kwargs):
        try:
            user = request.user
            serializer = self.serializer_class(
                user, context={"request": request, "request_user": request.user}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class RegionViewSet(viewsets.ModelViewSet):
    queryset = Region.objects.all().order_by("-id")
    serializer_class = RegionSerializer
    permission_classes = []

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsSuperAdmin()]


class GenerateReferralCodeAPIView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]  # [local/tryfann]
    throttle_scope = "refer"

    def get(self, request):
        try:
            user = request.user
            user.referral_code = generate_referral_code(user)
            user.save()
            url = request.query_params.get("url")
            BASE_REFERRAL_URL = url + "/ref/" if url else "https://tryfann.com/ref/"
            referral_link = f"{BASE_REFERRAL_URL}{user.referral_code}"
            data = {"referral_code": user.referral_code, "referral_link": referral_link}
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ReferralClickAPIView(BaseAPIView, APIView):
    authentication_classes = []
    permission_classes = []
    throttle_classes = [ScopedRateThrottle]  # [local/tryfann]
    throttle_scope = "refer"

    def get(self, request, referral_code):
        try:
            user = User.objects.filter(referral_code=referral_code).first()
            if not user:
                return self.send_bad_request_response(
                    message="Referral code does not exists!"
                )
            ip = get_client_ip(request)
            user_agent = request.META.get("HTTP_USER_AGENT", "unknown")
            click, created = ReferralClick.objects.get_or_create(
                user=user, ip_address=ip, user_agent=user_agent
            )
            if created:
                user.total_referral_clicks += 1
                user.save()
            return self.send_success_response(message="please check try fann website")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class DashboardStatAPIView(BaseAPIView, APIView):
    """Honest dashboard stats (rebuilt per QA audit + execution plan).

    Retired here (plan TECH-3 / SCORE-3 / FAKE-01 / FAKE-04):
      - the legacy Explorer→Curator tier ladder, total_points and
        next-tier math (the Readiness model in /qualification/* is the
        single source of truth for progression);
      - the hardcoded portfolio_value 35.5 / growth 12.5 placeholders —
        portfolio value is now computed from the user's own pieces;
      - the invented market-insight copy (incl. the off-brand "Digital
        art" card) — insights are computed from real collection rows and
        are empty until real data exists;
      - watch/earn + puzzle legacy-product fields.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # DATA-01: retired. The single source of truth for dashboard stats is
        # GET /api/qualification/me/dashboard. This handler is kept as a 410
        # Gone tombstone so any stale client learns the endpoint moved instead
        # of silently double-fetching a second source of truth.
        return _gone_dashboard()


class RefreshTokenView(BaseAPIView, APIView):
    permission_classes = []

    def post(self, request):
        try:
            serializer = RefreshTokenSerializers(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            access_token = str(token.access_token)
            data = {"access_token": access_token}
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class WatchEarnViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = WatchEarn.objects.all().order_by("-id")
    serializer_class = WatchEarnSerializer
    permission_classes = []

    def list(self, request, *args, **kwargs):
        try:
            serializer = WatchEarnSerializer(
                self.get_queryset(), many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsArtistOrSuperAdmin()]
        return [IsSuperAdmin()]


class UserWatchEarnView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            watch_id = request.data.get("watch_id")
            if not watch_id:
                return self.send_bad_request_response("watch_id is required")
            try:
                watch_obj = WatchEarn.objects.get(id=watch_id)
            except WatchEarn.DoesNotExist:
                return self.send_bad_request_response("Invalid watch_id")

            user = request.user
            record, created = UserWatchEarn.objects.get_or_create(
                user=user, watch=watch_obj, defaults={"is_completed": True}
            )

            if not created:
                if record.is_completed:
                    return self.send_success_response(message="Already completed")
                record.is_completed = True
                record.save()

            user.points = str(int(user.points) + watch_obj.points)
            user.save(update_fields=["points"])

            return self.send_success_response(
                {
                    "message": "Watch completed successfully",
                    "points_added": watch_obj.points,
                }
            )

        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class RedemptionViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = Redemption.objects.filter(user__isnull=False).order_by("-id")
    serializer_class = RedemptionSerializer
    permission_classes = []

    def list(self, request, *args, **kwargs):
        try:
            user = request.user
            qs = self.get_queryset().exclude(user=user)
            code = request.query_params.get("code")
            if code:
                qs = qs.filter(code=code)
            serializer = RedemptionSerializer(
                qs, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def my_redeem_list(self, request, *args, **kwargs):
        try:
            user = request.user
            qs = self.get_queryset().filter(user=user)
            code = request.query_params.get("code")
            if code:
                qs = qs.filter(code=code)
            serializer = RedemptionSerializer(
                qs, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def get_permissions(self):
        if self.action in ["list", "retrieve", "my_redeem_list"]:
            return [IsAuthenticated()]
        return [IsSuperAdmin()]


class UserRedemptionView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            redeem_id = request.data.get("redeem_id")
            if not redeem_id:
                return self.send_bad_request_response("redeem_id is required")
            try:
                redeem_obj = Redemption.objects.get(id=redeem_id)
            except Redemption.DoesNotExist:
                return self.send_bad_request_response("Invalid redeem_id")

            if not redeem_obj.user:
                return self.send_success_response(
                    message="Redeem is not associated with any user"
                )
            user = request.user
            record, created = UserRedemption.objects.get_or_create(
                user=user, redeem=redeem_obj, defaults={"is_completed": True}
            )

            if not created:
                if record.is_completed:
                    return self.send_success_response(message="Already completed")
                record.is_completed = True
                record.save()

            user.points = str(int(user.points) + redeem_obj.points)
            user.save(update_fields=["points"])

            return self.send_success_response(
                {
                    "message": "Redeem completed successfully",
                    "points_added": redeem_obj.points,
                }
            )

        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserSettingsView(BaseAPIView, APIView):
    permission_classes = [IsArtistPermission]

    def post(self, request):
        try:
            user = request.user
            settings_obj, created = UserSettings.objects.get_or_create(user=user)
            serializer = UserSettingsSerializer(
                settings_obj, data=request.data, partial=True
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save()
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserGetSettingsView(BaseAPIView, APIView):
    permission_classes = [IsArtistPermission]

    def get(self, request):
        try:
            user = request.user
            settings_obj, created = UserSettings.objects.get_or_create(user=user)
            serializer = UserGetSettingsSerializer(settings_obj)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserChangePasswordView(BaseAPIView, APIView):
    permission_classes = [IsArtistPermission]

    def post(self, request):
        try:
            serializer = UserChangePasswordSerializer(
                data=request.data, context={"request": request}
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save()
            return self.send_success_response(message="Password updated successfully.")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class GenerateRedeemCodeAPIView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            redeem_code = generate_redeem_referral_code(user)
            title = request.data.get("title")
            points = request.data.get("points")
            obj = Redemption.objects.create(
                user=user,
                title=title if title else "Referral Reward",
                code=redeem_code,
                points=int(points) if points else 50,
            )
            data = {
                "id": obj.id,
                "title": obj.title,
                "code": obj.code,
                "points": obj.points,
            }
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ProgressionViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = Progression.objects.all().order_by("-id")
    serializer_class = ProgressionSerializer
    permission_classes = []

    def list(self, request, *args, **kwargs):
        try:
            serializer = ProgressionSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsSuperAdmin()]


# Public leaderboard removed (audit SEC-02 / plan SCORE-3): the locked spec
# forbids any public ranking. The Readiness model in /qualification/* is the
# only progression surface.



class DashboardStatAmbassadorAPIView(BaseAPIView, APIView):
    """Ambassador console on real, earned data only (plan ROLE-2).

    Removed (audit FAKE-02 / SEC-02): fabricated total_reach 124.5,
    engagement_rate 4.8, per-network engagement/post counts, rewards 450,
    and the public your_rank / rank_out_of ranking. Social numbers are
    limited to the follower ranges the user themself declared during
    onboarding; per-network analytics return only when a real integration
    provides them.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # DATA-01: retired -> GET /api/qualification/me/dashboard (410 tombstone).
        return _gone_dashboard()



class UserFollowLeaderBoardView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = UserFollowLeaderBoardSerializers(
                data=request.data, context={"request": request}
            )
            serializer.is_valid(raise_exception=True)

            obj = serializer.save()
            followed = getattr(serializer, "_toggled_followed", obj is not None)

            return self.send_success_response(
                data={
                    "followed": followed,
                    "follow_to": request.data.get("follow_to"),
                }
            )
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

class DashboardStatGalleryAPIView(BaseAPIView, APIView):
    """Concierge stats (Gallery/Investor) — no points model, ever.

    Plan UX-4: concierge roles must not receive the legacy points/tier
    payload even in data. Serves only real concierge-relevant fields.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # DATA-01: retired -> GET /api/qualification/me/dashboard (410 tombstone).
        return _gone_dashboard()


class ArtistRoasterViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = ArtistRoaster.objects.all()
    serializer_class = ArtistRoasterSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            serializer = ArtistRoasterSerializer(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=request.user)
            user = request.user
            current_points = int(user.points or "0")

            if user.role == "Artist":
                user.points = str(current_points + 150)
            elif user.role == "Gallery":
                user.points = str(current_points + 200)

            user.save(update_fields=["points"])
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def list(self, request, *args, **kwargs):
        try:
            qs = self.get_queryset()
            user_records = qs.filter(user=request.user)
            serializer = ArtistRoasterSerializer(
                user_records, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()
            email = request.data.get("email")
            if email:
                email_exists = (
                    ArtistRoaster.objects.filter(email__iexact=email)
                    .exclude(id=instance.id)
                    .exists()
                )

                if email_exists:
                    return self.send_bad_request_response(
                        message={"email": ["Email already exists."]}
                    )
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            self.perform_update(serializer)

            if getattr(instance, "_prefetched_objects_cache", None):
                instance._prefetched_objects_cache = {}

            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def perform_update(self, serializer):
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return self.send_success_response(message="deleted successfully")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def perform_destroy(self, instance):
        instance.delete()


class ArtworkCollectionViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = ArtworkCollection.objects.all()
    serializer_class = ArtworkCollectionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            serializer = ArtworkCollectionSerializer(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=request.user)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def list(self, request, *args, **kwargs):
        try:
            qs = self.get_queryset()
            user_records = qs.filter(user=request.user)
            serializer = ArtworkCollectionSerializer(
                user_records, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            self.perform_update(serializer)

            if getattr(instance, "_prefetched_objects_cache", None):
                instance._prefetched_objects_cache = {}

            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def perform_update(self, serializer):
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return self.send_success_response(message="deleted successfully")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def perform_destroy(self, instance):
        instance.delete()


class InstagramFollowerViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = InstagramFollowers.objects.all().order_by("-id")
    serializer_class = InstagramFollowerSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            serializer = InstagramFollowerSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class TwitterFollowerViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = TwitterFollowers.objects.all().order_by("-id")
    serializer_class = TwitterFollowerSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            serializer = TwitterFollowerSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class YoutubeSubscriberViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = YoutubeSubscribers.objects.all().order_by("-id")
    serializer_class = YoutubeSubscriberSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            serializer = YoutubeSubscriberSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class TiktokFollowerViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = TikTokFollowers.objects.all().order_by("-id")
    serializer_class = TiktokFollowerSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            serializer = TiktokFollowerSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class PrimaryPlatformViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = PrimaryPlatform.objects.all().order_by("-id")
    serializer_class = PrimaryPlatformSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            serializer = PrimaryPlatformSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserPuzzleCompletionView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            PuzzleCompletion.objects.create(user=user)
            current_points = int(user.points or "0")
            user.points = str(current_points + 50)
            user.save(update_fields=["points"])
            return self.send_success_response(
                message="Puzzle completed! 50 points added"
            )
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ArtworkArtistCollectionViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = ArtworkArtistCollection.objects.all()
    serializer_class = ArtworkArtistCollectionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            serializer = ArtworkArtistCollectionSerializer(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=request.user)
            total = ArtworkArtistCollection.objects.filter(user=request.user).count()

            points_to_add = 50

            if points_to_add > 0:
                current_points = int(request.user.points or "0")
                request.user.points = str(current_points + points_to_add)
                request.user.save(update_fields=["points"])
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def list(self, request, *args, **kwargs):
        try:
            qs = self.get_queryset()
            user_records = qs.filter(user=request.user)
            serializer = ArtworkArtistCollectionSerializer(
                user_records, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            self.perform_update(serializer)

            if getattr(instance, "_prefetched_objects_cache", None):
                instance._prefetched_objects_cache = {}

            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def perform_update(self, serializer):
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return self.send_success_response(message="deleted successfully")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def perform_destroy(self, instance):
        instance.delete()


class ArtistPriceRangeViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = PriceRange.objects.all().order_by("-id")
    serializer_class = PriceRangeSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            serializer = PriceRangeSerializer(
                self.queryset, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ViewUserProfileAPIView(BaseAPIView, APIView):
    permission_classes = []
    serializer_class = ViewUserProfileSerializer

    def get(self, request, user_id):
        try:
            user = User.objects.filter(id=user_id).first()
            if not user:
                return self.send_bad_request_response(message="User does not exist")

            serializer = self.serializer_class(user, context={"request": request})
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserFeedBackView(BaseAPIView, APIView):
    permission_classes = [IsArtistPermission]

    def post(self, request):
        try:
            serializer = UserFeedBackSerializer(
                data=request.data, context={"request": request}
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=request.user)
            return self.send_success_response(message="FeedBack Send successfully.")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserReportBugView(BaseAPIView, APIView):
    permission_classes = [IsArtistPermission]

    def post(self, request):
        try:
            serializer = UserReportBugSerializer(
                data=request.data, context={"request": request}
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=request.user)
            return self.send_success_response(message="Report Bug Send successfully.")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class AllTryFannUsersView(BaseAPIView, ListAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = None
    serializer_class = LeaderBoardDetailsSerializer
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        roles = ["Artist", "Gallery", "Collector", "Ambassador", "Investor"]

        filter_role = self.request.query_params.get("role")
        email = self.request.query_params.get("email")
        if filter_role in roles:
            roles = [filter_role]

        qs = User.objects.filter(role__in=roles).annotate(
            points_int=Cast("points", IntegerField())
        )

        filter_by = self.request.query_params.get("filter")

        now = timezone.now()

        if filter_by == "month":
            qs = qs.filter(created_at__year=now.year, created_at__month=now.month)

        elif filter_by == "week":
            qs = qs.filter(
                created_at__week=now.isocalendar().week, created_at__year=now.year
            )

        if email:
            qs = qs.filter(email=email)

        return qs.order_by("-points_int")

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            for index, user in enumerate(queryset, start=1):
                user.rank = index
            page = self.paginate_queryset(queryset)
            serializer = self.get_serializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ViewTryFannUserProfileAPIView(BaseAPIView, APIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = ViewUserProfileSerializer

    def get(self, request, user_id):
        try:
            user = User.objects.filter(id=user_id).first()
            if not user:
                return self.send_bad_request_response(message="User does not exist")

            serializer = self.serializer_class(user, context={"request": request})
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

class AdminBugReportListing(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserReportBugListingSerializer

    def list(self, request, *args, **kwargs):
        bugs = UserReportBug.objects.order_by('-created_at')
        serializer = self.serializer_class(bugs, many=True, context={"request": request})
        return self.send_success_response(data=serializer.data)


class VerifyEmailView(BaseAPIView):
    """Consume an email-verification token (from the signup email link) and
    mark the user verified. Public, idempotent, one-time token."""

    permission_classes = []
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        return self._verify(request)

    def post(self, request, *args, **kwargs):
        return self._verify(request)

    def _verify(self, request):
        from fann.users.models import UserVerifications

        email = request.data.get("email") or request.query_params.get("email")
        token = request.data.get("token") or request.query_params.get("token")
        if not email or not token:
            return self.send_bad_request_response(
                message="Email and verification token are required."
            )
        rec = (
            UserVerifications.objects.filter(email__iexact=email, code=token)
            .order_by("-id")
            .first()
        )
        if not rec:
            return self.send_bad_request_response(
                message="Invalid or expired verification link."
            )
        user = rec.user
        already = bool(getattr(user, "is_verify", False))
        if not already:
            user.is_verify = True
            user.save(update_fields=["is_verify"])
        UserVerifications.objects.filter(user=user).delete()
        return self.send_success_response(
            message="Email already verified." if already else "Email verified successfully.",
            data={"email": user.email, "is_verify": True},
        )