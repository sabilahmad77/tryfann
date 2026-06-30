import os
from fann.common.response_mixins import BaseAPIView
from rest_framework.generics import CreateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.throttling import ScopedRateThrottle  # [local/tryfann] rate limits
from fann.qualification.antifraud import record_signup_fingerprint  # [local/tryfann]
from .serializers import (
    UserRegisterSerializer,
    UserFinalMarketSerializer,
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
    LeaderBoardDetailsSerializer,
    UserFollowLeaderBoardSerializers,
    ArtistRoasterSerializer,
    ArtworkCollectionSerializer,
    UserLeaderBoardDetailsSerializer,
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
    get_user_leaderboard_rank,
)
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import IntegerField
from django.db.models.functions import Cast
from django.db.models import IntegerField, Avg, Count
from .pagination import CustomPageNumberPagination


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

            if user.last_login is None:
                current_points = int(user.points or "0")
                user.points = str(current_points + 25)

            user.last_login = timezone.now()
            user.save(update_fields=["points", "last_login"])

            refresh = RefreshToken.for_user(user)
            user_data = UserFinalMarketSerializer(
                user, context={"request": request}
            ).data
            user_data["refresh"] = str(refresh)
            user_data["access"] = str(refresh.access_token)
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            url = request.query_params.get("url")
            BASE_REFERRAL_URL = url + "/ref/" if url else "https://tryfann.com/ref/"
            referral_link = f"{BASE_REFERRAL_URL}{user.referral_code}"

            total_watch_earn = WatchEarn.objects.count()
            user_completed_watch = UserWatchEarn.objects.filter(
                user=user, is_completed=True
            ).count()
            if total_watch_earn > 0:
                watched_percentage = round(
                    (user_completed_watch / total_watch_earn) * 100, 2
                )
            else:
                watched_percentage = 0

            referral_count = UserReferral.objects.filter(referenced_by=user).count()
            pending = UserReferral.objects.filter(
                referenced_by=user, referenced_to__profile_completed=False
            ).count()
            conversion = UserReferral.objects.filter(
                referenced_by=user, referenced_to__profile_completed=True
            ).count()

            # Influence Points
            referral_points = referral_count * 100
            influence_points = round(referral_points * 0.20, 2)
            user_points = int(user.points or 0)
            curator_points = (user_points - 500) / (2000 - 500) * 100
            user_followers = UserFollower.objects.filter(follow_to=user).count()
            user_following = UserFollower.objects.filter(follow_by=user).count()

            tiers = [
                ("Explorer", 0, 500),
                ("Curator", 501, 1500),
                ("Patron", 1501, 3500),
                ("Ambassador", 3501, 7500),
                ("Founding Patron", 7501, float("inf")),
            ]

            tier_name = ""
            tier_min = 0
            tier_max = 0
            next_tier_need = 0
            next_tier_name = ""

            for i, (name, min_p, max_p) in enumerate(tiers):
                if min_p <= user_points <= max_p:
                    tier_name = name
                    tier_min = min_p
                    tier_max = max_p

                    # Calculate next tier requirement
                    if i < len(tiers) - 1:
                        next_tier_name = tiers[i + 1][0]
                        next_min_required = tiers[i + 1][1]
                        next_tier_need = max(next_min_required - user_points, 0)
                    break

            if tier_max == float("inf"):
                tier_progress = 100
            else:
                tier_progress = ((user_points - tier_min) / (tier_max - tier_min)) * 100
                tier_progress = round(tier_progress, 2)

            CATEGORY_META = {
                "Contemporary": "Growing demand for contemporary Gulf Artist",
                "Digital": "Digital art market expanding rapidly",
                "Photography": "Steady interest in documentary photography",
                "Sculpture": "Temporary dip in sculptural works",
            }

            artworks = ArtworkCollection.objects.values("category").annotate(
                avg_price=Avg("purchase_value"), total=Count("id")
            )

            artwork_map = {
                item["category"]: {
                    "avg_price": round(item["avg_price"] or 0, 2),
                    "total": item["total"],
                }
                for item in artworks
            }

            total_artworks = sum(item["total"] for item in artwork_map.values())

            market_insight = []

            for category, description in CATEGORY_META.items():
                category_data = artwork_map.get(category, {"avg_price": 0, "total": 0})

                percentage = (
                    round((category_data["total"] / total_artworks) * 100, 2)
                    if total_artworks
                    else 0
                )

                market_insight.append(
                    {
                        "category": category,
                        "description": description,
                        "avg_price": category_data["avg_price"],
                        "percentage": percentage,
                    }
                )
            artwork_count = ArtworkArtistCollection.objects.filter(user=user).count()
            collection_count = ArtworkCollection.objects.filter(user=user).count()

            data = {
                "total_referral_clicks": user.total_referral_clicks,
                "total_points": int(user.points or 0),
                "referral_link": referral_link,
                "influence_points": int(influence_points),
                "provenance_points": 0,
                "profile_completed": 50,
                "referral_joined": 100,
                "first_login": 25,
                "total_clicks": referral_count,
                "conversation": conversion,
                "pending": pending,
                "curator_percentage": curator_points,
                "watched_percentage": watched_percentage,
                "total_watch_earn": total_watch_earn,
                "user_completed_watch": user_completed_watch,
                "referral_count": referral_count,
                "artwork_count": artwork_count,
                "collection_count": collection_count,
                "is_referral_code": True if user.referral_code else False,
                "user_followers": user_followers,
                "user_following": user_following,
                "portfolio_value": 35.5,
                "growth": 12.5,
                "tier_name": tier_name,
                "tier_progress_percentage": tier_progress,
                "next_tier_need_points": next_tier_need,
                "next_tier_name": next_tier_name,
                "puzzle_completed": PuzzleCompletion.objects.filter(
                    user=request.user
                ).exists(),
                "profile_complete": user.profile_completed,
                "market_insight": market_insight,
            }
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


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


class LeaderBoardDetailsView(BaseAPIView, ListAPIView):
    permission_classes = []
    queryset = None
    serializer_class = LeaderBoardDetailsSerializer
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        roles = ["Artist", "Gallery", "Collector", "Ambassador", "Investor"]

        filter_role = self.request.query_params.get("role")
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


class DashboardStatAmbassadorAPIView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            url = request.query_params.get("url")
            BASE_REFERRAL_URL = url + "/ref/" if url else "https://tryfann.com/ref/"
            referral_link = f"{BASE_REFERRAL_URL}{user.referral_code}"

            total_watch_earn = WatchEarn.objects.count()
            user_completed_watch = UserWatchEarn.objects.filter(
                user=user, is_completed=True
            ).count()
            if total_watch_earn > 0:
                watched_percentage = round(
                    (user_completed_watch / total_watch_earn) * 100, 2
                )
            else:
                watched_percentage = 0

            referral_active_count = UserReferral.objects.filter(
                referenced_by=user, referenced_to__is_active=True
            ).count()

            referral_count = UserReferral.objects.filter(referenced_by=user).count()
            pending = UserReferral.objects.filter(
                referenced_by=user, referenced_to__profile_completed=False
            ).count()
            conversion = UserReferral.objects.filter(
                referenced_by=user, referenced_to__profile_completed=True
            ).count()

            user_followers = UserFollower.objects.filter(follow_to=user).count()
            user_following = UserFollower.objects.filter(follow_by=user).count()

            artwork_count = ArtworkArtistCollection.objects.filter(user=user).count()
            collection_count = ArtworkCollection.objects.filter(user=user).count()

            # Influence Points
            referral_points = referral_count * 100
            influence_points = round(referral_points * 0.20, 2)
            user_points = int(user.points or "0")
            curator_points = (user_points - 500) / (2000 - 500) * 100
            # leaderboard rank
            leaderboard_data = get_user_leaderboard_rank(user)
            your_rank = leaderboard_data["rank"]
            out_of = leaderboard_data["out_of"]

            tiers = [
                ("Explorer", 0, 500),
                ("Curator", 501, 1500),
                ("Patron", 1501, 3500),
                ("Ambassador", 3501, 7500),
                ("Founding Patron", 7501, float("inf")),
            ]

            tier_name = ""
            tier_min = 0
            tier_max = 0
            next_tier_need = 0
            next_tier_name = ""

            for i, (name, min_p, max_p) in enumerate(tiers):
                if min_p <= user_points <= max_p:
                    tier_name = name
                    tier_min = min_p
                    tier_max = max_p

                    if i < len(tiers) - 1:
                        next_tier_name = tiers[i + 1][0]
                        next_min_required = tiers[i + 1][1]
                        next_tier_need = max(next_min_required - user_points, 0)
                    break

            if tier_max == float("inf"):
                tier_progress = 100
            else:
                tier_progress = ((user_points - tier_min) / (tier_max - tier_min)) * 100
                tier_progress = round(tier_progress, 2)

            social_data = {
                "instagram_follower": getattr(user.instagram_follower, "range", None),
                "instagram_engagement": 4.2,
                "instagram_post": 124,
                "tiktok_follower": getattr(user.tiktok_follower, "range", None),
                "tiktok_engagement": 6.8,
                "tiktok_post": 89,
                "youtube_subscriber": getattr(user.youtube_subscribers, "range", None),
                "youtube_engagement": 3.1,
                "youtube_post": 34,
                "twitter_follower": getattr(user.twitter_follower, "range", None),
                "twitter_engagement": 2.4,
                "twitter_post": 312,
            }
            data = {
                "your_rank": your_rank,
                "rank_out_of": out_of,
                "total_reach": 124.5,
                "engagement_rate": 4.8,
                "total_referral_clicks": user.total_referral_clicks,
                "total_points": int(user.points or 0),
                "referral_link": referral_link,
                "influence_points": int(influence_points),
                "provenance_points": 0,
                "profile_completed": 50,
                "referral_joined": 100,
                "first_login": 25,
                "curator_percentage": curator_points,
                "watched_percentage": watched_percentage,
                "total_watch_earn": total_watch_earn,
                "user_completed_watch": user_completed_watch,
                "referral_count": referral_count,
                "artwork_count": artwork_count,
                "collection_count": collection_count,
                "is_referral_code": True if user.referral_code else False,
                "rewards_point": 450,
                "active_referral_count": referral_active_count,
                "user_followers": user_followers,
                "user_following": user_following,
                "social_stats": social_data,
                "puzzle_completed": PuzzleCompletion.objects.filter(
                    user=request.user
                ).exists(),
                "conversation": conversion,
                "pending": pending,
                "tier_name": tier_name,
                "tier_progress_percentage": tier_progress,
                "next_tier_need_points": next_tier_need,
                "next_tier_name": next_tier_name,
                "profile_complete": user.profile_completed,
            }
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class UserLeaderBoardDetailsView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserLeaderBoardDetailsSerializer
    pagination_class = CustomPageNumberPagination

    def get_queryset(self):
        roles = ["Artist", "Gallery", "Collector", "Ambassador"]

        filter_role = self.request.query_params.get("role")
        if filter_role in roles:
            roles = [filter_role]

        qs = User.objects.filter(role__in=roles).annotate(
            points_int=Cast("points", IntegerField())
        )

        # Optional filter by week/month
        filter_by = self.request.query_params.get("filter")  # values: month, week, all
        now = timezone.now()

        if filter_by == "month":
            qs = qs.filter(created_at__year=now.year, created_at__month=now.month)
        elif filter_by == "week":
            qs = qs.filter(
                created_at__week=now.isocalendar().week, created_at__year=now.year
            )

        return qs.order_by("-points_int")

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.get_queryset()
            total_users = queryset.count()
            total_founding_patron = queryset.filter(points_int__gt=5000).count()
            avg_points = queryset.aggregate(avg=Avg("points_int"))["avg"] or 0
            avg_points = round(avg_points, 2)

            ranked_users = []
            your_rank = None

            for index, user in enumerate(queryset, start=1):
                user.rank = index
                ranked_users.append(user)

                if request.user.is_authenticated and request.user.id == user.id:
                    your_rank = index

            page = self.paginate_queryset(ranked_users)
            if page is not None:
                serializer = self.get_serializer(
                    page, many=True, context={"request": request}
                )
                paginated_data = self.get_paginated_response(serializer.data).data
            else:
                serializer = self.get_serializer(
                    ranked_users, many=True, context={"request": request}
                )
                paginated_data = {"results": serializer.data}

            paginated_data.update(
                {
                    "your_rank": your_rank,
                    "total_users": total_users,
                    "total_founding_patron": total_founding_patron,
                    "average_points": avg_points,
                }
            )

            return self.send_success_response(data=paginated_data)

        except Exception as e:
            return self.send_bad_request_response(message=str(e))


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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            referral_count = UserReferral.objects.filter(referenced_by=user).count()
            user_followers = UserFollower.objects.filter(follow_to=user).count()
            user_following = UserFollower.objects.filter(follow_by=user).count()
            referral_points = referral_count * 100
            influence_points = round(referral_points * 0.20, 2)

            url = request.query_params.get("url")
            BASE_REFERRAL_URL = url + "/ref/" if url else "https://tryfann.com/ref/"
            referral_link = f"{BASE_REFERRAL_URL}{user.referral_code}"

            pending = UserReferral.objects.filter(
                referenced_by=user, referenced_to__profile_completed=False
            ).count()
            conversion = UserReferral.objects.filter(
                referenced_by=user, referenced_to__profile_completed=True
            ).count()

            artwork_count = ArtworkArtistCollection.objects.filter(user=user).count()
            collection_count = ArtworkCollection.objects.filter(user=user).count()

            user_points = int(user.points or 0)

            # Define tiers
            tiers = [
                ("Explorer", 0, 500),
                ("Curator", 501, 1500),
                ("Patron", 1501, 3500),
                ("Ambassador", 3501, 7500),
                ("Founding Patron", 7501, float("inf")),
            ]

            tier_name = ""
            tier_min = 0
            tier_max = 0
            next_tier_need = 0
            next_tier_name = ""

            for i, (name, min_p, max_p) in enumerate(tiers):
                if min_p <= user_points <= max_p:
                    tier_name = name
                    tier_min = min_p
                    tier_max = max_p

                    # Calculate next tier requirement
                    if i < len(tiers) - 1:
                        next_tier_name = tiers[i + 1][0]
                        next_min_required = tiers[i + 1][1]
                        next_tier_need = max(next_min_required - user_points, 0)
                    break

            if tier_max == float("inf"):
                tier_progress = 100
            else:
                tier_progress = ((user_points - tier_min) / (tier_max - tier_min)) * 100
                tier_progress = round(tier_progress, 2)

            data = {
                "total_points": user_points,
                "referral_link": referral_link,
                "influence_points": int(influence_points),
                "provenance_points": 0,
                "user_followers": user_followers,
                "user_following": user_following,
                "profile_completed": 50,
                "referral_joined": 100,
                "first_login": 25,
                "tier_name": tier_name,
                "tier_progress_percentage": tier_progress,
                "next_tier_need_points": next_tier_need,
                "next_tier_name": next_tier_name,
                "puzzle_completed": PuzzleCompletion.objects.filter(
                    user=request.user
                ).exists(),
                "total_clicks": referral_count,
                "conversation": conversion,
                "pending": pending,
                "referral_count": referral_count,
                "profile_complete": user.profile_completed,
                "is_referral_code": True if user.referral_code else False,
                "total_referral_clicks": user.total_referral_clicks,
                "artwork_count": artwork_count,
                "collection_count": collection_count,
            }

            return self.send_success_response(data=data)

        except Exception as e:
            return self.send_bad_request_response(message=str(e))


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