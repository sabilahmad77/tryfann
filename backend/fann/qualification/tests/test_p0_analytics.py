"""
P0-4: acquisition attribution on signup, IP anonymization on analytics events,
and the per-step admin funnel counting the canonical events.
"""
from rest_framework.test import APIClient
from django.test import TestCase

from fann.qualification.models import AnalyticsEvent
from fann.users.models import User


def _register(client, email, **extra):
    body = {
        "first_name": "T", "last_name": "User", "email": email,
        "password": "TryfannTest2026!", "confirm_password": "TryfannTest2026!",
        "role": "Collector", "points": "0",
    }
    body.update(extra)
    return client.post("/api/market_final/register", body, format="json")


class AcquisitionSourceTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_direct_signup(self):
        _register(self.client, "direct.p04@test.local")
        u = User.objects.get(email="direct.p04@test.local")
        self.assertEqual(u.acquisition_source, "direct")

    def test_utm_signup(self):
        _register(self.client, "utm.p04@test.local", utm_source="newsletter")
        u = User.objects.get(email="utm.p04@test.local")
        self.assertEqual(u.acquisition_source, "newsletter")

    def test_referral_signup(self):
        ref = User.objects.create_user(email="ref.p04@test.local", password="x", role="Artist")
        ref.referral_code = "TF-REF12345"
        ref.save(update_fields=["referral_code"])
        _register(self.client, "referred.p04@test.local", referral_code="TF-REF12345")
        u = User.objects.get(email="referred.p04@test.local")
        self.assertEqual(u.acquisition_source, "referral:TF-REF12345")


class IpAnonymizationTests(TestCase):
    def test_analytics_ip_is_anonymized(self):
        client = APIClient()
        client.post(
            "/api/qualification/analytics/events",
            {"name": "page_view", "props": {"path": "/"}, "session_id": "s1"},
            format="json",
            REMOTE_ADDR="203.0.113.77",
        )
        ev = AnalyticsEvent.objects.filter(name="page_view").latest("id")
        self.assertEqual(ev.ip, "203.0.113.0")  # last octet zeroed


class FunnelTests(TestCase):
    def test_overview_funnel_counts_canonical_events(self):
        for name in ("signup_started", "signup_completed", "email_verified",
                     "referral_shared", "referral_converted"):
            AnalyticsEvent.objects.create(name=name, props={})
        admin = User.objects.create_user(
            email="admin.p04@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        c = APIClient()
        c.force_authenticate(admin)
        funnel = c.get("/api/qualification/admin/overview").json()["data"]["funnel"]
        for step in ("signup_started", "signup_completed", "email_verified",
                     "referral_shared", "referral_converted"):
            self.assertEqual(funnel[step], 1, f"funnel missing step {step}")
