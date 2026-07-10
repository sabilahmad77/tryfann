"""
DATA-02: numeric fields serialize as JSON numbers, not strings.

The user model keeps `points` and `profile_step` as legacy CharFields ("75",
"1"). Every client payload must expose them as real integers, and the
qualification /me + dashboard counters must be integers too.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from fann.market_final.serializers import UserFinalMarketSerializer
from fann.users.models import User


class NumericTypeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="num.data02@test.local", password="x", role="Artist"
        )
        # Legacy CharField values, exactly as older rows store them.
        self.user.points = "75"
        self.user.profile_step = "1"
        self.user.save(update_fields=["points", "profile_step"])

    def _assert_int(self, value, label):
        self.assertIsInstance(value, int, f"{label} must be int, got {type(value).__name__}")
        self.assertNotIsInstance(value, bool, f"{label} must not be a bool")

    def test_user_serializer_points_and_step_are_int(self):
        data = UserFinalMarketSerializer(self.user).data
        self._assert_int(data["points"], "points")
        self._assert_int(data["profile_step"], "profile_step")
        self.assertEqual(data["points"], 75)
        self.assertEqual(data["profile_step"], 1)

    def test_bad_charfield_values_coerce_to_zero(self):
        self.user.points = "not-a-number"
        self.user.profile_step = None
        self.user.save(update_fields=["points", "profile_step"])
        data = UserFinalMarketSerializer(self.user).data
        self.assertEqual(data["points"], 0)
        self.assertEqual(data["profile_step"], 0)

    def test_me_endpoint_numeric_types(self):
        self.client.force_authenticate(self.user)
        data = self.client.get("/api/qualification/me").json()["data"]
        for key in ("points", "readiness_score", "completion_pct", "verified_referrals"):
            self._assert_int(data[key], f"/me.{key}")

    def test_dashboard_counters_numeric_types(self):
        self.client.force_authenticate(self.user)
        data = self.client.get("/api/qualification/me/dashboard").json()["data"]
        for key in (
            "total_referral_clicks", "referral_count", "total_clicks",
            "conversion", "pending", "user_followers", "user_following",
            "artwork_count", "collection_count",
        ):
            self._assert_int(data[key], f"dashboard.{key}")
