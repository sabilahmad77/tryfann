"""
P1-a: role-based onboarding persists per-role application data + role selection,
and emits the application_submitted funnel event.
"""
from rest_framework.test import APIClient
from django.test import TestCase

from fann.qualification.models import AnalyticsEvent
from fann.users.models import User


class OnboardingPersistenceTests(TestCase):
    def _apply(self, role, data):
        u = User.objects.create_user(email=f"{role.lower()}.p1a@test.local", password="x", role=role)
        c = APIClient()
        c.force_authenticate(u)
        r = c.post(
            "/api/market_final/role_application",
            {"application_data": data, "role": role, "profile_step": 3},
            format="json",
        )
        u.refresh_from_db()
        return r, u

    def test_artist_application_persists(self):
        r, u = self._apply("Artist", {"portfolio_url": "https://example.com/art", "bio": "painter"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(u.application_data.get("portfolio_url"), "https://example.com/art")
        self.assertEqual(u.role, "Artist")

    def test_gallery_application_persists(self):
        r, u = self._apply("Gallery", {"gallery_name": "Blue Room", "location": "Dubai"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(u.application_data.get("gallery_name"), "Blue Room")

    def test_application_submitted_event_fired(self):
        self._apply("Collector", {"budget": "5k-10k"})
        self.assertTrue(AnalyticsEvent.objects.filter(name="application_submitted").exists())

    def test_save_and_continue_merges(self):
        u = User.objects.create_user(email="merge.p1a@test.local", password="x", role="Artist")
        c = APIClient()
        c.force_authenticate(u)
        c.post("/api/market_final/role_application", {"application_data": {"a": 1}}, format="json")
        c.post("/api/market_final/role_application", {"application_data": {"b": 2}}, format="json")
        u.refresh_from_db()
        self.assertEqual(u.application_data.get("a"), 1)  # earlier answers preserved
        self.assertEqual(u.application_data.get("b"), 2)
