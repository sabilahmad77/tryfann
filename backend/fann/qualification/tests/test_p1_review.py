"""
P1-c: admin decisions require a reason on reject, are logged with reviewer +
reason + timestamp, and are authorized server-side (superuser only).
"""
from rest_framework.test import APIClient
from django.test import TestCase

from fann.qualification.models import AuditLog
from fann.users.models import KYCVerification, User


class KycReviewReasonTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            email="super.p1c@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        self.staff = User.objects.create_user(
            email="staff.p1c@test.local", password="x", role="Collector", is_staff=True,
        )
        self.applicant = User.objects.create_user(
            email="applicant.p1c@test.local", password="x", role="Artist"
        )
        self.kyc = KYCVerification.objects.create(user=self.applicant, status="Pending")

    def _post(self, body):
        return self.client.post(
            f"/api/qualification/admin/kyc/{self.kyc.id}/review", body, format="json"
        )

    def test_reject_without_reason_is_400(self):
        self.client.force_authenticate(self.superadmin)
        r = self._post({"decision": "reject"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("reason", str(r.json().get("message")).lower())

    def test_reject_with_reason_logs_and_notifies(self):
        self.client.force_authenticate(self.superadmin)
        r = self._post({"decision": "reject", "reason": "ID photo unreadable"})
        self.assertEqual(r.status_code, 200)
        self.kyc.refresh_from_db()
        self.assertEqual(self.kyc.status, "Rejected")
        log = AuditLog.objects.filter(action="kyc_reject", target_id=str(self.kyc.pk)).latest("id")
        self.assertEqual(log.actor_id, self.superadmin.id)
        self.assertEqual(log.metadata.get("reason"), "ID photo unreadable")

    def test_approve_works_and_logs(self):
        self.client.force_authenticate(self.superadmin)
        r = self._post({"decision": "approve"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(
            AuditLog.objects.filter(action="kyc_approve", target_id=str(self.kyc.pk)).exists()
        )

    def test_staff_non_superuser_cannot_decide(self):
        self.client.force_authenticate(self.staff)
        r = self._post({"decision": "approve"})
        self.assertEqual(r.status_code, 403)
