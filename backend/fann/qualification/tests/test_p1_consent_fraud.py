"""
P1-d GDPR consent (versioned, provable, double-opt-in) + P1-b fraud-review queue.
"""
from rest_framework.test import APIClient
from django.test import TestCase

from fann.qualification.models import AuditLog, ConsentRecord, ReferralCredit
from fann.users.models import User


class ConsentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="consent.p1d@test.local", password="x", role="Artist")

    def test_analytics_consent_recorded_immediately(self):
        self.client.force_authenticate(self.user)
        r = self.client.post("/api/qualification/consent",
                             {"consent_type": "analytics", "granted": True}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["data"]["double_opt_in_confirmed"])
        self.assertEqual(ConsentRecord.objects.filter(user=self.user, consent_type="analytics").count(), 1)

    def test_marketing_grant_requires_double_opt_in(self):
        self.client.force_authenticate(self.user)
        r = self.client.post("/api/qualification/consent",
                             {"consent_type": "marketing", "granted": True}, format="json")
        self.assertTrue(r.json()["data"]["double_opt_in_required"])
        self.assertFalse(r.json()["data"]["double_opt_in_confirmed"])
        rec = ConsentRecord.objects.get(user=self.user, consent_type="marketing")
        self.assertTrue(rec.confirm_token)
        # confirm via token
        c = self.client.post("/api/qualification/consent/confirm", {"token": rec.confirm_token}, format="json")
        self.assertEqual(c.status_code, 200)
        rec.refresh_from_db()
        self.assertTrue(rec.double_opt_in_confirmed)

    def test_withdrawal_is_a_new_immutable_row(self):
        self.client.force_authenticate(self.user)
        self.client.post("/api/qualification/consent", {"consent_type": "analytics", "granted": True}, format="json")
        self.client.post("/api/qualification/consent", {"consent_type": "analytics", "granted": False}, format="json")
        rows = ConsentRecord.objects.filter(user=self.user, consent_type="analytics")
        self.assertEqual(rows.count(), 2)  # history preserved

    def test_export_returns_consent_proof(self):
        self.client.force_authenticate(self.user)
        self.client.post("/api/qualification/consent", {"consent_type": "terms", "granted": True}, format="json")
        data = self.client.get("/api/qualification/consent").json()["data"]["consents"]
        self.assertTrue(any(c["consent_type"] == "terms" and c["granted"] for c in data))


class FraudReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.superadmin = User.objects.create_user(
            email="super.p1b@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        self.referrer = User.objects.create_user(email="referrer.p1b@test.local", password="x", role="Artist")
        self.referee = User.objects.create_user(email="referee.p1b@test.local", password="x", role="Artist")
        self.flag = AuditLog.objects.create(
            action="fraud_flag", target_type="referral", target_id=str(self.referee.id),
            metadata={"reason": "duplicate_ip_signup"},
        )
        self.credit = ReferralCredit.objects.create(
            referrer=self.referrer, referee=self.referee, points_awarded=25,
        )

    def test_queue_lists_flags(self):
        self.client.force_authenticate(self.superadmin)
        flags = self.client.get("/api/qualification/admin/fraud-review").json()["data"]["flags"]
        self.assertTrue(any(f["flag_id"] == self.flag.id for f in flags))

    def test_void_withholds_reward_and_logs(self):
        self.client.force_authenticate(self.superadmin)
        r = self.client.post("/api/qualification/admin/fraud-review",
                             {"flag_id": self.flag.id, "resolution": "void", "reason": "same device"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.credit.refresh_from_db()
        self.assertEqual(self.credit.points_awarded, 0)  # reward withheld
        self.assertTrue(AuditLog.objects.filter(action="fraud_resolved", metadata__flag_id=self.flag.id).exists())

    def test_resolve_requires_reason(self):
        self.client.force_authenticate(self.superadmin)
        r = self.client.post("/api/qualification/admin/fraud-review",
                             {"flag_id": self.flag.id, "resolution": "dismiss"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_non_superuser_blocked(self):
        member = User.objects.create_user(email="member.p1b@test.local", password="x", role="Artist")
        self.client.force_authenticate(member)
        self.assertEqual(self.client.get("/api/qualification/admin/fraud-review").status_code, 403)
