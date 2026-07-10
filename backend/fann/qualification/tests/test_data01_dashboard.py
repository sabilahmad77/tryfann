"""
DATA-01 / DATA-02 contract tests — the dashboard has ONE source of truth.

RED (pre-fix): the client read tier/readiness/stats/portfolio from BOTH
/qualification/* AND legacy /market_final/dashboard_stats*, so two endpoints
could disagree. GREEN (this fix): the qualification namespace is the only
source; the legacy handlers return 410 Gone; every counter is a real integer.

These tests are the automated regression guard behind the live network capture
in FIX_REPORT_v2.md. Run: `python manage.py test fann.qualification.tests`.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from fann.users.models import User

# Counters that MUST serialize as JSON integers (audit DATA-02).
INT_COUNTERS = [
    "total_referral_clicks",
    "referral_count",
    "total_clicks",
    "conversion",
    "conversation",
    "pending",
    "user_followers",
    "user_following",
    "artwork_count",
    "collection_count",
]

# The legacy stat endpoints that must now be gone (audit DATA-01).
LEGACY_STAT_ENDPOINTS = [
    "/api/market_final/dashboard_stats",
    "/api/market_final/dashboard_stats_gallery",
    "/api/market_final/dashboard_stats_ambassador",
]


class DashboardSingleSourceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # post_save signal auto-provisions RoleProfile + WhitelistEntry.
        self.artist = User.objects.create_user(
            email="artist.data01@test.local", password="x", role="Artist"
        )
        self.collector = User.objects.create_user(
            email="collector.data01@test.local", password="x", role="Collector"
        )
        self.gallery = User.objects.create_user(
            email="gallery.data01@test.local", password="x", role="Gallery"
        )
        self.ambassador = User.objects.create_user(
            email="amb.data01@test.local", password="x", role="Ambassador"
        )

    # ---- DATA-01: legacy handlers retired ----------------------------------
    def test_legacy_stat_endpoints_return_410_gone(self):
        self.client.force_authenticate(self.artist)
        for url in LEGACY_STAT_ENDPOINTS:
            resp = self.client.get(url)
            self.assertEqual(
                resp.status_code, 410, f"{url} should be 410 Gone, got {resp.status_code}"
            )

    # ---- DATA-01: single source responds for every track -------------------
    def test_me_dashboard_is_the_single_source(self):
        for user in (self.artist, self.collector, self.gallery, self.ambassador):
            self.client.force_authenticate(user)
            resp = self.client.get("/api/qualification/me/dashboard")
            self.assertEqual(resp.status_code, 200, user.role)
            self.assertIn("data", resp.json())

    # ---- DATA-02: counters are integers, not strings -----------------------
    def test_counters_are_integers(self):
        self.client.force_authenticate(self.artist)
        data = self.client.get("/api/qualification/me/dashboard").json()["data"]
        for key in INT_COUNTERS:
            self.assertIn(key, data, f"missing counter {key}")
            self.assertIsInstance(
                data[key], int, f"{key} must be int, got {type(data[key]).__name__}"
            )
            # JSON has no separate bool/int, so guard against True/False leaking.
            self.assertNotIsInstance(data[key], bool, f"{key} must not be a bool")

    # ---- Product model: game track sees portfolio; concierge never does ----
    def test_game_track_has_portfolio_and_insight(self):
        self.client.force_authenticate(self.artist)
        data = self.client.get("/api/qualification/me/dashboard").json()["data"]
        self.assertEqual(data.get("track"), "game")
        self.assertIn("portfolio_value", data)
        self.assertIn("market_insight", data)

    def test_concierge_track_never_gets_portfolio_or_insight(self):
        self.client.force_authenticate(self.gallery)
        data = self.client.get("/api/qualification/me/dashboard").json()["data"]
        self.assertEqual(data.get("track"), "concierge")
        self.assertNotIn("portfolio_value", data)
        self.assertNotIn("market_insight", data)

    def test_ambassador_social_stats_present(self):
        self.client.force_authenticate(self.ambassador)
        data = self.client.get("/api/qualification/me/dashboard").json()["data"]
        self.assertIn("social_stats", data)
        self.assertIsInstance(data.get("active_referral_count"), int)

    # ---- DATA-01: the artwork/collection/roster reads live under /qualification
    def test_alias_read_endpoints_respond(self):
        cases = [
            (self.artist, "/api/qualification/me/artworks"),
            (self.collector, "/api/qualification/me/collection"),
            (self.gallery, "/api/qualification/me/roster"),
        ]
        for user, url in cases:
            self.client.force_authenticate(user)
            resp = self.client.get(url)
            self.assertEqual(resp.status_code, 200, url)
            self.assertIsInstance(resp.json().get("data"), list, url)

    # ---- Auth is still enforced on the single source -----------------------
    def test_me_dashboard_requires_auth(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get("/api/qualification/me/dashboard")
        self.assertEqual(resp.status_code, 401)
