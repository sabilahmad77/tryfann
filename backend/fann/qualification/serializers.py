from rest_framework import serializers


class RoleProfileUpdateSerializer(serializers.Serializer):
    """Persist role-specific signup answers + (optionally) the role."""

    details = serializers.JSONField(required=False)
    role = serializers.CharField(required=False, allow_blank=True, max_length=50)


class AnalyticsEventSerializer(serializers.Serializer):
    """Funnel analytics event — may be sent pre-signup (anonymous)."""

    name = serializers.CharField(max_length=80)
    props = serializers.JSONField(required=False)
    session_id = serializers.CharField(
        required=False, allow_blank=True, max_length=64
    )
