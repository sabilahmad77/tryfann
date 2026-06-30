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
