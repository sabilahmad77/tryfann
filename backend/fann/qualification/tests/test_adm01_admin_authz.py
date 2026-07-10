"""
ADM-01 admin authorization contract.

Every /qualification/admin/* route is server-side gated on is_staff. The
irreversible decisions — KYC approve/reject, applicant moderation (tier /
priority / flag), task-review moderation — additionally require a Django
superuser. A staff member can *view* the queues but cannot *decide*.

Matrix proven here:
  unauth                 -> 401 everywhere
  member (not staff)     -> 403 everywhere (read AND decide)
  staff, not superuser   -> 200 on reads, 403 on every decision
  superuser              -> passes authz on decisions (not 401/403)
"""
from django.test import TestCase
from rest_framework.test import APIClient

from fann.users.models import User

READ_ENDPOINTS = [
    "/api/qualification/admin/overview",
    "/api/qualification/admin/applicants",
]

# (url, method) for the irreversible decision endpoints. Bogus ids are fine:
# a superuser reaching the handler gets 400 "Unknown ...", which still proves
# authorization passed; a blocked caller gets 401/403 before the handler runs.
DECISION_ENDPOINTS = [
    "/api/qualification/admin/applicants/999999/action",
    "/api/qualification/admin/user-tasks/999999/review",
    "/api/qualification/admin/kyc/999999/review",
]


class AdminAuthzTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.member = User.objects.create_user(
            email="member.adm01@test.local", password="x", role="Collector"
        )
        self.staff = User.objects.create_user(
            email="staff.adm01@test.local", password="x", role="Collector",
            is_staff=True,
        )
        self.superuser = User.objects.create_user(
            email="super.adm01@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )

    # ---- unauthenticated -> 401 -------------------------------------------
    def test_unauthenticated_is_401(self):
        self.client.force_authenticate(user=None)
        for url in READ_ENDPOINTS:
            self.assertEqual(self.client.get(url).status_code, 401, url)
        for url in DECISION_ENDPOINTS:
            self.assertEqual(self.client.post(url, {}).status_code, 401, url)

    # ---- member (no staff) -> 403 everywhere ------------------------------
    def test_member_is_forbidden_everywhere(self):
        self.client.force_authenticate(self.member)
        for url in READ_ENDPOINTS:
            self.assertEqual(self.client.get(url).status_code, 403, url)
        for url in DECISION_ENDPOINTS:
            self.assertEqual(self.client.post(url, {}).status_code, 403, url)

    # ---- staff (not superuser) -> can read, cannot decide -----------------
    def test_staff_can_read_queues(self):
        self.client.force_authenticate(self.staff)
        for url in READ_ENDPOINTS:
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_staff_non_superuser_cannot_decide(self):
        self.client.force_authenticate(self.staff)
        for url in DECISION_ENDPOINTS:
            self.assertEqual(
                self.client.post(url, {"decision": "approve"}).status_code,
                403,
                f"{url} must be 403 for a staff-but-not-superuser account",
            )

    # ---- superuser -> passes authorization on decisions -------------------
    def test_superuser_passes_authz_on_decisions(self):
        self.client.force_authenticate(self.superuser)
        for url in DECISION_ENDPOINTS:
            code = self.client.post(url, {"decision": "approve"}).status_code
            self.assertNotIn(
                code, (401, 403),
                f"{url} should pass authz for a superuser (got {code})",
            )
