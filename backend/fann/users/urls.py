from django.urls import path, include
from fann.users import views
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter


from fann.users.views import (
    AdminUserListView,
    AdminUserDetailView,
    AdminKYCReviewView,
    AdminDashboardKPIView,
    UpdateProfileAPI,
    AdminApproveUserKYC,
    KycBlockView,
    KycUnBlockView,
    AddUserPortFolioView,
    SellerListingView,
    SellerStatsView,
    OrganizationUserView,
    InviteSellerView,
    NotificationSettingView,
    PreferenceSettingView,
    UserSocialView,
    UpdatePasswordView,
    ForgetPassword,
    ResetPassword,
    SwitchRoleView,
    AddUserContractView,
    Verify2FAView,
    Setting2FAView,
    OrgSecuritySettingsView,
    GetOrgSecuritySettingsView,
    EditUserProfileView,
    DeleteUserAccountView,
    CommunityChallengeViewSet, TryFanKycView, AnalyticsOverviewView, PerformanceAnalyticsView, AudienceAnalyticsView,
    RevenueAnalyticsView, ShippedOrdersView, AIInsightsView, AddWithDrawRequest, AdminWithDrawRequestView,
    UserBankAccountView,
)

router = DefaultRouter()
router.register(
    "community_challenge", CommunityChallengeViewSet, basename="community_challenge"
)

urlpatterns = [
    path("", include(router.urls)),
    path("signup", views.UserCreateView.as_view(), name="signup"),
    path("user_verification", views.UserVerificationEmail.as_view(), name="signup"),
    path(
        "verification_email/",
        views.UserVerificationEmail.as_view(),
        name="send_verification_email_again",
    ),
    path("login", views.LoginViewSet.as_view(), name="login"),
    path("google_login", views.GoogleLoginView.as_view(), name="login"),
    path("user_details", views.UserDetailView.as_view(), name="user_details"),
    path(
        "update_banner", views.UpdateProfileBannerView.as_view(), name="update_banner"
    ),
    path("token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    #     kyc-verfication
    path("kyc/submit", views.KYCSubmitView.as_view(), name="kyc_submit"),
    path("kyc/<int:pk>/decision", views.KYCApprovalView.as_view(), name="kyc_decision"),
    path("admin/block", KycBlockView.as_view(), name="kyc_block"),
    path("admin/un_block", KycUnBlockView.as_view(), name="kyc_block"),
    #     SuperAdmin
    path("admin/users/", AdminUserListView.as_view()),
    path("admin/approve_kyc/", AdminApproveUserKYC.as_view(), name="admin-approve-kyc"),
    path("admin/users/<int:id>/", AdminUserDetailView.as_view()),
    path("admin/users/<int:user_id>/kyc/", AdminKYCReviewView.as_view()),
    path("admin/dashboard/kpis/", AdminDashboardKPIView.as_view()),
    path("update_profile", UpdateProfileAPI.as_view(), name="update_profile"),
    path("add_portfolio", AddUserPortFolioView.as_view(), name="update_profile"),
    # Seller APIs
    path("seller_listing", SellerListingView.as_view(), name="seller_listing"),
    path("create_seller", SellerListingView.as_view(), name="create_seller"),
    path("update_seller/<int:pk>", SellerListingView.as_view(), name="seller_listing"),
    path("delete_seller/<int:pk>", SellerListingView.as_view(), name="seller_listing"),
    path("seller_stats", SellerStatsView.as_view(), name="seller_stats"),
    path("user_management_stats", OrganizationUserView.as_view(), name="seller_stats"),
    # Invitation
    path("invite_seller", InviteSellerView.as_view(), name="invite_seller"),
    # Notification Settings
    path(
        "get_notification_settins",
        NotificationSettingView.as_view(),
        name="get_notification_settings",
    ),
    path(
        "update_notification_settings/<int:pk>/",
        NotificationSettingView.as_view(),
        name="update_notification_settings",
    ),
    # Preference Settings
    path(
        "get_preference_settins",
        PreferenceSettingView.as_view(),
        name="get_notification_settings",
    ),
    path(
        "update_preference_settings/<int:pk>/",
        PreferenceSettingView.as_view(),
        name="update_notification_settings",
    ),
    path("add_social/", UserSocialView.as_view(), name="social"),
    path("update_social/<int:pk>/", UserSocialView.as_view(), name="social"),
    path("delete_social/<int:pk>/", UserSocialView.as_view(), name="social"),
    # Password
    path("set_new_password/", UpdatePasswordView.as_view(), name="set_new_password"),
    path("forget_password/", ForgetPassword.as_view(), name="set_new_password"),
    path("reset_password/", ResetPassword.as_view(), name="set_new_password"),
    # Role
    path("switch_role/", SwitchRoleView.as_view(), name="switch_role"),
    # Contract
    path("add_contract/", AddUserContractView.as_view(), name="add_contract"),
    path("verify_2fa/", Verify2FAView.as_view(), name="verify_2fa"),
    path("2fa_setting/", Setting2FAView.as_view(), name="2fa_setting"),
    path(
        "org_security_settings/",
        OrgSecuritySettingsView.as_view(),
        name="org_security_settings",
    ),
    path(
        "get_org_security_settings",
        GetOrgSecuritySettingsView.as_view(),
        name="get_org_security_settings",
    ),
    path("edit_user_profile/", EditUserProfileView.as_view(), name="edit_user_profile"),
    path("delete_account/", DeleteUserAccountView.as_view(), name="delete_account"),
    # Try Fann KYC
    path('try_fan_kyc/', TryFanKycView.as_view(), name="try_fan_kyc"),
    path('update_kyc_status/<int:pk>/', TryFanKycView.as_view(), name="try_fan_kyc"),
    # Overview - Total Views, Likes, Collectors, Revenue with MoM comparison
    path('overview/', AnalyticsOverviewView.as_view(), name='analytics-overview'),

    # Performance - Individual artwork performance metrics
    path('performance/', PerformanceAnalyticsView.as_view(), name='analytics-performance'),

    # Audience - Geographic distribution and collector insights
    path('audience/', AudienceAnalyticsView.as_view(), name='analytics-audience'),

    # Revenue - Monthly revenue breakdown with charts
    path('revenue/', RevenueAnalyticsView.as_view(), name='analytics-revenue'),

    # Shipped Orders - Track shipped/in-transit orders
    path('shipped/', ShippedOrdersView.as_view(), name='analytics-shipped'),

    # AI Insights - AI-powered recommendations and insights
    path('ai-insights/', AIInsightsView.as_view(), name='analytics-ai-insights'),

    # WithDraw Requests
    path('add_withdraw_request/', AddWithDrawRequest.as_view(), name='add_withdraw_request'),
    path('list_withdraw_request/', AddWithDrawRequest.as_view(), name='add_withdraw_request'),

    # Admin Withdraw Requests
    path("users_withdraw_requests/", AdminWithDrawRequestView.as_view(), name="users_withdraw_requests"),
    path("update_withdraw_requests/<int:pk>/", AdminWithDrawRequestView.as_view(), name="update_withdraw_requests"),

    # Bank Accounts
    path('add_bank_account/', UserBankAccountView.as_view(), name="add_bank_account"),
    path('bank_account_listing/', UserBankAccountView.as_view(), name="add_bank_account"),
    path('update_bank_account/<int:pk>/', UserBankAccountView.as_view(), name="add_bank_account"),



]
