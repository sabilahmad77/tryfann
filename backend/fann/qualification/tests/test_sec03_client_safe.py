"""
SEC-03: sensitive Django fields never reach a browser.

The user payload the client receives (login / register / me / public profile /
settings) must not carry is_staff, is_superuser, is_deleted, any *_otp / *_2fa
material, or user_contract. The client instead gets an intentional `is_admin`
hint for the CRM-UI gate. Verified for a member (game) AND a concierge role.
"""
from django.test import TestCase
from rest_framework.test import APIClient

from fann.common.user_safety import SENSITIVE_USER_FIELDS
from fann.market_final.serializers import UserFinalMarketSerializer
from fann.users.models import User

FORBIDDEN = (
    "is_staff",
    "is_superuser",
    "is_deleted",
    "user_contract",
    "fann_2fa",
    "fann_2fa_otp",
    "fann_2fa_otp_created",
    "password",
)


def _assert_clean(testcase, data, label):
    for key in FORBIDDEN:
        testcase.assertNotIn(key, data, f"{label} leaked {key}")
    for key in data:
        low = key.lower()
        testcase.assertFalse(
            low.endswith("_otp") or "_2fa" in low,
            f"{label} leaked otp/2fa-like field {key}",
        )


class ClientSafeUserTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.member = User.objects.create_user(
            email="member.sec03@test.local", password="x", role="Artist"
        )
        self.concierge = User.objects.create_user(
            email="concierge.sec03@test.local", password="x", role="Gallery"
        )
        self.admin = User.objects.create_user(
            email="admin.sec03@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )

    def test_login_serializer_clean_for_member_and_concierge(self):
        for user, label in ((self.member, "member"), (self.concierge, "concierge")):
            data = UserFinalMarketSerializer(user).data
            _assert_clean(self, data, f"login[{label}]")
            self.assertIn("is_admin", data, label)
            self.assertFalse(data["is_admin"], label)

    def test_login_serializer_admin_gets_is_admin_true_not_is_staff(self):
        data = UserFinalMarketSerializer(self.admin).data
        _assert_clean(self, data, "login[admin]")
        self.assertTrue(data["is_admin"])

    def test_view_user_profile_endpoint_clean(self):
        # A member viewing another user's public profile must not see that
        # user's privilege flags — including when the viewed user is an admin.
        self.client.force_authenticate(self.member)
        resp = self.client.get(f"/api/market_final/view_user_profile/{self.admin.id}/")
        self.assertEqual(resp.status_code, 200)
        _assert_clean(self, resp.json()["data"], "view_profile[admin]")

    def test_me_endpoint_clean(self):
        for user, label in ((self.member, "member"), (self.concierge, "concierge")):
            self.client.force_authenticate(user)
            data = self.client.get("/api/qualification/me").json()["data"]
            _assert_clean(self, data, f"/me[{label}]")

    def test_policy_lists_the_privilege_flags(self):
        # Guardrail: the shared policy must keep covering the flags this
        # finding is about, so a future edit can't quietly drop them.
        for f in ("is_staff", "is_superuser", "is_deleted", "user_contract"):
            self.assertIn(f, SENSITIVE_USER_FIELDS)
