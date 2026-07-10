"""
Client-safe user serialization policy (audit SEC-03 / AUTH-02).

One place decides which User model fields must never reach a browser, so every
serializer that dumps a user (login, /me, public profile view, settings) can
share it and the policy can't silently go stale. The client receives an
intentional `is_admin` hint instead of the raw Django privilege columns; real
authorization is always enforced server-side.
"""

# Sensitive Django auth-internal / private columns. Never serialized to a client.
SENSITIVE_USER_FIELDS = (
    "password",
    "fann_2fa",
    "fann_2fa_otp",
    "fann_2fa_otp_created",
    "user_contract",
    "is_deleted",
    "is_staff",
    "is_superuser",
)


# Legacy CharField columns that hold a number but serialize as a string
# ("75", "1"). The client must receive real integers (audit DATA-02).
NUMERIC_USER_FIELDS = ("points", "profile_step")


def _to_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def coerce_numeric_user_fields(data):
    """Cast the legacy string-numeric user fields to int, in place."""
    for field in NUMERIC_USER_FIELDS:
        if field in data and not isinstance(data[field], bool):
            data[field] = _to_int(data[field])
    return data


def strip_sensitive_user_fields(data):
    """Remove every sensitive key from a serialized user dict, in place.

    Besides the explicit denylist, this pattern-sweeps any ``*_otp`` /
    ``*_2fa*`` / privilege-flag key a future migration might add, so a new
    sensitive column can't leak just because someone forgot to list it.
    """
    for field in SENSITIVE_USER_FIELDS:
        data.pop(field, None)
    for key in list(data.keys()):
        low = key.lower()
        if (
            low.endswith("_otp")
            or "_2fa" in low
            or low in ("is_staff", "is_superuser", "is_deleted")
        ):
            data.pop(key, None)
    return data


class ClientSafeUserMixin:
    """Mixin for any User ModelSerializer.

    Strips sensitive fields (SEC-03) and casts legacy string-numeric fields to
    integers (DATA-02) so every user payload is uniformly client-safe.
    """

    def to_representation(self, instance):
        data = super().to_representation(instance)
        strip_sensitive_user_fields(data)
        coerce_numeric_user_fields(data)
        return data
