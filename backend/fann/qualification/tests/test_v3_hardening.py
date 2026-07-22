"""
v3 audit hardening tests: H3 (reward exception leak), N6 (KYC empty POST),
H4 (test-harness accounts excluded from the admin funnel).
"""
from django.test import TestCase
from rest_framework.test import APIClient

from fann.users.models import User


class RewardExceptionLeakTests(TestCase):
    """H3: crafted reward bodies return typed 400s, never raw Python strings."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="reward.v3@test.local", password="x", role="Artist"
        )
        self.client.force_authenticate(self.user)

    def test_scalar_points_reward_is_typed_400_not_exception(self):
        r = self.client.post(
            "/api/market_final/reward",
            {"goal_type": "referral", "points_reward": 5},
            format="json",
        )
        self.assertEqual(r.status_code, 400)
        body = r.json()
        msg = str(body.get("message"))
        # No raw interpreter strings leaked.
        for leak in ("not iterable", "invalid literal", "has no len", "object of type"):
            self.assertNotIn(leak, msg, f"leaked interpreter string: {msg}")

    def test_valid_lists_accepted(self):
        r = self.client.post(
            "/api/market_final/reward",
            {"goal_type": ["referral"], "points_reward": [5]},
            format="json",
        )
        self.assertIn(r.status_code, (200, 201))


class KycEmptyPostTests(TestCase):
    """N6: an empty KYC POST is rejected with a typed 400 (was silently 200)."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="kyc.v3@test.local", password="x", role="Artist"
        )
        self.client.force_authenticate(self.user)

    def test_empty_post_rejected(self):
        r = self.client.post(
            "/api/market_final/kyc_verification", {}, format="json"
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn("id_number", str(r.json().get("message")))


class ApplicantsExcludeTestAccountsTests(TestCase):
    """H4: harness accounts don't appear in the admin funnel."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin.v3@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        # real + harness applicants
        User.objects.create_user(email="realuser.v3@test.local", password="x", role="Artist")
        User.objects.create_user(email="flow_123@tryfann.com", password="x", role="Artist")
        User.objects.create_user(email="closed_9@tryfann.com", password="x", role="Artist")
        User.objects.create_user(email="sabil+tf9@gmail.com", password="x", role="Artist")

    def test_harness_accounts_excluded_from_applicants(self):
        self.client.force_authenticate(self.admin)
        data = self.client.get("/api/qualification/admin/applicants").json()["data"]
        emails = [a.get("email") for a in data.get("applicants", [])]
        for bad in ("flow_123@tryfann.com", "closed_9@tryfann.com", "sabil+tf9@gmail.com"):
            self.assertNotIn(bad, emails, f"{bad} should be excluded")
        self.assertIn("realuser.v3@test.local", emails)

    def test_overview_counts_exclude_harness(self):
        self.client.force_authenticate(self.admin)
        data = self.client.get("/api/qualification/admin/overview").json()["data"]
        # admin + realuser = real; the 3 harness accounts must not be counted
        self.assertLessEqual(data["totals"]["applicants"], 2)
