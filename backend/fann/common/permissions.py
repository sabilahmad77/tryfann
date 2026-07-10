from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        # Ensure the user is authenticated and has a 'role' field
        if request.user and request.user.is_authenticated:
            # Check if the role is ADMIN
            return request.user.role in ["ADMIN"]
        return False


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and getattr(request.user, "role", "") == "SuperAdmin"
        )


class IsStaffSuperuser(BasePermission):
    """Elevated admin gate (audit ADM-01).

    Requires the Django ``is_staff`` AND ``is_superuser`` flags — NOT the
    string ``role``. A staff member can view the admin queues (IsAdminUser),
    but only a superuser may make irreversible decisions: KYC approve/reject,
    applicant moderation (tier/priority/flag), and task-review moderation.
    """

    message = "Superuser privileges are required for this action."

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and u.is_staff and u.is_superuser
        )


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        # Ensure the user is authenticated and has a 'role' field
        if request.user and request.user.is_authenticated:
            # Check if the role is CUSTOMER
            return request.user.role in ["CUSTOMER"]
        return False


class IsArtistPermission(BasePermission):
    def has_permission(self, request, view):
        # Ensure the user is authenticated and has a 'role' field
        if request.user and request.user.is_authenticated:
            # Check if the role is CUSTOMER
            return request.user.role in [
                "Artist",
                "Organization",
                "Gallery",
                "Collector",
                "Ambassador",
                "Investor",
            ]
        return False


class IsArtistOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return IsArtistPermission().has_permission(
            request, view
        ) or IsSuperAdmin().has_permission(request, view)
