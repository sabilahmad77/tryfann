from django.contrib import admin

from .models import (
    AnalyticsEvent,
    AuditLog,
    PointsLedger,
    ReferralCredit,
    RoleProfile,
    WhitelistEntry,
)


@admin.register(RoleProfile)
class RoleProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "track", "readiness_score", "completion_pct", "score_updated_at")
    list_filter = ("role", "track")
    search_fields = ("user__email",)


@admin.register(WhitelistEntry)
class WhitelistEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "tier", "score_at_review", "position", "manual_override")
    list_filter = ("tier", "manual_override")
    search_fields = ("user__email",)


@admin.register(PointsLedger)
class PointsLedgerAdmin(admin.ModelAdmin):
    list_display = ("user", "delta", "reason", "source", "dedupe_key", "created_at")
    list_filter = ("reason",)
    search_fields = ("user__email", "dedupe_key")
    # Append-only: discourage edits from the admin.
    readonly_fields = ("user", "delta", "reason", "source", "metadata", "dedupe_key")

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ReferralCredit)
class ReferralCreditAdmin(admin.ModelAdmin):
    list_display = ("referrer", "referee", "points_awarded", "referee_ip", "created_at")
    search_fields = ("referrer__email", "referee__email")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "actor", "target_type", "target_id", "created_at")
    list_filter = ("action",)
    search_fields = ("actor__email", "target_id")


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "session_id", "ip", "created_at")
    list_filter = ("name",)
    search_fields = ("user__email", "session_id")


from fann.qualification import services
from fann.qualification.models import Task, UserTask


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("key", "title_en", "points", "verification", "roles", "is_active", "sort_order")
    list_filter = ("verification", "is_active")
    search_fields = ("key", "title_en")


@admin.register(UserTask)
class UserTaskAdmin(admin.ModelAdmin):
    list_display = ("user", "task", "status", "reviewed_by", "reviewed_at", "created_at")
    list_filter = ("status", "task__key")
    search_fields = ("user__email", "task__key")
    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="Approve selected (award points + promote + email)")
    def approve_selected(self, request, queryset):
        n = 0
        for ut in queryset.select_related("task", "user"):
            services.approve_user_task(ut, reviewer=request.user)
            n += 1
        self.message_user(request, f"Approved {n} task completion(s).")

    @admin.action(description="Reject selected")
    def reject_selected(self, request, queryset):
        n = 0
        for ut in queryset.select_related("task", "user"):
            services.reject_user_task(ut, reviewer=request.user)
            n += 1
        self.message_user(request, f"Rejected {n} task completion(s).")


from .models import ConciergeRequest  # noqa: E402  (plan ROLE-3 staff queue)


@admin.register(ConciergeRequest)
class ConciergeRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "status", "message", "created_at", "handled_by")
    list_filter = ("kind", "status")
    search_fields = ("user__email",)
