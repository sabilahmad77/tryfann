from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .models import UserFeedBack
from .views import (
    UserRegisterView,
    VerifyEmailView,
    RoleApplicationView,
    ProfileSetupView,
    UserInterestView,
    UserRewardView,
    GETUserDetailsView,
    KYCVerificationView,
    RegionViewSet,
    UserLoginView,
    GenerateReferralCodeAPIView,
    ReferralClickAPIView,
    DashboardStatAPIView,
    RefreshTokenView,
    WatchEarnViewSet,
    UserWatchEarnView,
    RedemptionViewSet,
    UserRedemptionView,
    UserSettingsView,
    UserGetSettingsView,
    UserChangePasswordView,
    GenerateRedeemCodeAPIView,
    ProgressionViewSet,
    DashboardStatAmbassadorAPIView,
    UserFollowLeaderBoardView,
    DashboardStatGalleryAPIView,
    ArtistRoasterViewSet,
    ArtworkCollectionViewSet,
    InstagramFollowerViewSet,
    TwitterFollowerViewSet,
    YoutubeSubscriberViewSet,
    TiktokFollowerViewSet,
    PrimaryPlatformViewSet,
    UserPuzzleCompletionView,
    ArtistPriceRangeViewSet,
    ArtworkArtistCollectionViewSet,
    ViewUserProfileAPIView,
    UserFeedBackView,
    UserReportBugView,
    AllTryFannUsersView,
    ViewTryFannUserProfileAPIView, AdminBugReportListing,
)

router = DefaultRouter()
router.register("regions", RegionViewSet, basename="regions")
router.register("watch_earn", WatchEarnViewSet, basename="watch_earn")
router.register("redemption", RedemptionViewSet, basename="redemption")
router.register("progression", ProgressionViewSet, basename="progression")
router.register("artist_roaster", ArtistRoasterViewSet, basename="artist_roaster")
router.register(
    "artwork_collection", ArtworkCollectionViewSet, basename="artwork_collection"
)
router.register(
    "instagram_follower", InstagramFollowerViewSet, basename="instagram_follower"
)
router.register("twitter_follower", TwitterFollowerViewSet, basename="twitter_follower")
router.register(
    "youtube_subscriber", YoutubeSubscriberViewSet, basename="youtube_subscriber"
)
router.register("tiktok_follower", TiktokFollowerViewSet, basename="tiktok_follower")
router.register("primary_platform", PrimaryPlatformViewSet, basename="primary_platform")
router.register(
    "artist_price_range", ArtistPriceRangeViewSet, basename="artist_price_range"
)
router.register(
    "artwork_artist", ArtworkArtistCollectionViewSet, basename="artwork_artist"
)
urlpatterns = [
    path("", include(router.urls)),
    path("register", UserRegisterView.as_view(), name="register"),
    path("user_login", UserLoginView.as_view(), name="user_login"),
    path("profile_setup", ProfileSetupView.as_view(), name="profile_setup"),
    path("role_application", RoleApplicationView.as_view(), name="role_application"),
    path("user_interest", UserInterestView.as_view(), name="user_interest"),
    path("reward", UserRewardView.as_view(), name="reward"),
    path("kyc_verification", KYCVerificationView.as_view(), name="kyc_verification"),
    path("get_user_details", GETUserDetailsView.as_view(), name="get_user_details"),
    path(
        "referral_code_generate",
        GenerateReferralCodeAPIView.as_view(),
        name="referral_code_generate",
    ),
    path(
        "ref/<str:referral_code>", ReferralClickAPIView.as_view(), name="referral-click"
    ),
    path("dashboard_stats", DashboardStatAPIView.as_view(), name="dashboard_stats"),
    path("token/refresh", RefreshTokenView.as_view(), name="dashboard_stats"),
    path("user_watch_earn", UserWatchEarnView.as_view(), name="user_watch_earn"),
    path("user_redemption", UserRedemptionView.as_view(), name="user_redemption"),
    path("user_settings", UserSettingsView.as_view(), name="user_settings"),
    path("user_get_settings", UserGetSettingsView.as_view(), name="user_get_settings"),
    path(
        "user_change_password",
        UserChangePasswordView.as_view(),
        name="user_change_password",
    ),
    path(
        "redeem_code_generate",
        GenerateRedeemCodeAPIView.as_view(),
        name="redeem_code_generate",
    ),
    path(
        "my_redeem_list",
        RedemptionViewSet.as_view({"get": "my_redeem_list"}),
        name="my_redeem_list",
    ),
    path(
        "dashboard_stats_ambassador",
        DashboardStatAmbassadorAPIView.as_view(),
        name="dashboard_stats_ambassador",
    ),
    path("follow_user", UserFollowLeaderBoardView.as_view(), name="follow_user"),
    path(
        "dashboard_stats_gallery",
        DashboardStatGalleryAPIView.as_view(),
        name="dashboard_stats_gallery",
    ),
    path(
        "user_puzzle_completion",
        UserPuzzleCompletionView.as_view(),
        name="user_puzzle_completion",
    ),
    path(
        "view_user_profile/<int:user_id>/",
        ViewUserProfileAPIView.as_view(),
        name="view_user_profile",
    ),
    path("user_feedback", UserFeedBackView.as_view(), name="user_feedback"),
    path("user_report_bug", UserReportBugView.as_view(), name="user_report_bug"),
    path(
        "all_try_fann_users", AllTryFannUsersView.as_view(), name="all_try_fann_users"
    ),
    path(
        "view_try_fann_user_profile/<int:user_id>/",
        ViewTryFannUserProfileAPIView.as_view(),
        name="view_try_fann_user_profile",
    ),

    # Admin
    path('admin_bug_listing/', AdminBugReportListing.as_view(), name='admin_bug_listing'),

    # Email verification (consumes the token from the signup email link)
    path('verify_email', VerifyEmailView.as_view(), name='verify_email'),

]
