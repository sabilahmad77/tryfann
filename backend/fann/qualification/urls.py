from django.urls import path

from fann.qualification.admin_api import (
    AdminApplicantActionView,
    AdminApplicantsCSVView,
    AdminApplicantsView,
    AdminCollectorSegmentsView,
    AdminContentView,
    AdminCuratorInvitationView,
    AdminFoundingCapView,
    AdminFraudReviewView,
    AdminOverviewView,
    AdminPendingKYCView,
    AdminPendingTasksView,
    AdminReferralTreeView,
    AdminReviewKYCView,
    AdminReviewTaskView,
    AdminWaitlistStatusView,
)
from fann.qualification.views import (
    AnalyticsEventView,
    CompleteTaskView,
    ConciergeRequestView,
    ConsentView,
    ConsentConfirmView,
    CuratorInvitationAcceptView,
    FoundingStatusView,
    MeErasureView,
    MeView,
    MeDashboardView,
    MeArtworksView,
    MeCollectionView,
    MeRosterView,
    MyTasksView,
    RoleProfileView,
)

urlpatterns = [
    path("me", MeView.as_view(), name="qualification-me"),
    path("me/tasks", MyTasksView.as_view(), name="qualification-my-tasks"),
    path("me/dashboard", MeDashboardView.as_view(), name="qualification-me-dashboard"),
    path("me/artworks", MeArtworksView.as_view(), name="qualification-me-artworks"),
    path("me/collection", MeCollectionView.as_view(), name="qualification-me-collection"),
    path("me/roster", MeRosterView.as_view(), name="qualification-me-roster"),
    path(
        "me/tasks/<slug:key>/complete",
        CompleteTaskView.as_view(),
        name="qualification-complete-task",
    ),
    path("role-profile", RoleProfileView.as_view(), name="qualification-role-profile"),
    path(
        "concierge/requests",
        ConciergeRequestView.as_view(),
        name="qualification-concierge-requests",
    ),
    path(
        "analytics/events",
        AnalyticsEventView.as_view(),
        name="qualification-analytics-events",
    ),
    # --- P1-d GDPR consent + Enh-3 self-service erasure ---
    path("consent", ConsentView.as_view(), name="qualification-consent"),
    path("consent/confirm", ConsentConfirmView.as_view(), name="qualification-consent-confirm"),
    path("me/erase", MeErasureView.as_view(), name="qualification-me-erase"),
    # --- P1-11/P1-12 founding tiers, caps + waitlist status (user-facing) ---
    path("founding/status", FoundingStatusView.as_view(), name="qualification-founding-status"),
    # --- P1-9 curator invitation accept (authenticated) ---
    path(
        "curator-invitations/accept",
        CuratorInvitationAcceptView.as_view(),
        name="qualification-curator-accept",
    ),
    # --- Admin CRM (staff-only) ---
    path("admin/fraud-review", AdminFraudReviewView.as_view(), name="crm-fraud-review"),
    path(
        "admin/curator-invitations",
        AdminCuratorInvitationView.as_view(),
        name="crm-curator-invitations",
    ),
    path("admin/founding-caps", AdminFoundingCapView.as_view(), name="crm-founding-caps"),
    path(
        "admin/waitlist-status",
        AdminWaitlistStatusView.as_view(),
        name="crm-waitlist-status",
    ),
    path(
        "admin/collector-segments",
        AdminCollectorSegmentsView.as_view(),
        name="crm-collector-segments",
    ),
    path("admin/overview", AdminOverviewView.as_view(), name="crm-overview"),
    path("admin/applicants", AdminApplicantsView.as_view(), name="crm-applicants"),
    path(
        "admin/applicants.csv",
        AdminApplicantsCSVView.as_view(),
        name="crm-applicants-csv",
    ),
    path(
        "admin/applicants/<int:user_id>/action",
        AdminApplicantActionView.as_view(),
        name="crm-applicant-action",
    ),
    path(
        "admin/pending-tasks",
        AdminPendingTasksView.as_view(),
        name="crm-pending-tasks",
    ),
    path(
        "admin/user-tasks/<int:user_task_id>/review",
        AdminReviewTaskView.as_view(),
        name="crm-review-task",
    ),
    path(
        "admin/referral-tree",
        AdminReferralTreeView.as_view(),
        name="crm-referral-tree",
    ),
    path(
        "admin/pending-kyc",
        AdminPendingKYCView.as_view(),
        name="crm-pending-kyc",
    ),
    path(
        "admin/kyc/<int:kyc_id>/review",
        AdminReviewKYCView.as_view(),
        name="crm-review-kyc",
    ),
    path("admin/content", AdminContentView.as_view(), name="crm-content"),
]
