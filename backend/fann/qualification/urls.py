from django.urls import path

from fann.qualification.admin_api import (
    AdminApplicantActionView,
    AdminApplicantsCSVView,
    AdminApplicantsView,
    AdminContentView,
    AdminOverviewView,
    AdminPendingKYCView,
    AdminPendingTasksView,
    AdminReferralTreeView,
    AdminReviewKYCView,
    AdminReviewTaskView,
)
from fann.qualification.views import (
    AnalyticsEventView,
    CompleteTaskView,
    ConciergeRequestView,
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
    # --- Admin CRM (staff-only) ---
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
