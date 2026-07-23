"""
Stage 4 — closing the remaining P1 requirements + scoped enhancements.

Covers:
  P1-6  collector preference profiling (new fields, queue boost, segmentation)
  P1-9  curator invitation (issue / accept -> role / revoke / expiry / authz)
  P1-11 founding caps + truthful counters (admin adjust, real fill numbers)
  P1-12 waitlist application status (transitions logged, verify auto-move, authz)
  Enh-1 device fingerprinting (capture + duplicate-device flag)
  Enh-3 self-service erasure (PII scrub, confirm gate, superuser refusal)
"""
from types import SimpleNamespace

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from fann.qualification import services
from fann.qualification.antifraud import record_signup_fingerprint
from fann.qualification.models import (
    AuditLog,
    CuratorInvitation,
    FoundingTierCap,
    PointsLedger,
    WhitelistEntry,
)
from fann.users.models import IntersetReward, User


def _fake_request(data=None, ip="203.0.113.9", ua="pytest-UA", meta_extra=None):
    meta = {"REMOTE_ADDR": ip, "HTTP_USER_AGENT": ua}
    if meta_extra:
        meta.update(meta_extra)
    return SimpleNamespace(data=data or {}, META=meta)


# --------------------------------------------------------------------------- #
# Enh-1 — device fingerprinting
# --------------------------------------------------------------------------- #
class DeviceFingerprintTests(TestCase):
    def _mk(self, email):
        u = User.objects.create_user(email=email, password="x", role="Artist")
        services.ensure_qualification(u)
        return u

    def test_fingerprint_stored_on_role_profile(self):
        from fann.qualification.models import RoleProfile

        u = self._mk("fp1@test.local")
        record_signup_fingerprint(u, _fake_request(data={"device_fingerprint": "DEV-ABC"}))
        rp = RoleProfile.objects.get(user=u)
        self.assertEqual((rp.details or {}).get("device_fingerprint"), "DEV-ABC")

    def test_duplicate_device_fingerprint_flags(self):
        # Two signups from the same device within the window -> fraud flag.
        for i in range(2):
            u = self._mk(f"fpdup{i}@test.local")
            record_signup_fingerprint(u, _fake_request(
                data={"device_fingerprint": "SAME-DEVICE"}, ip=f"198.51.100.{i}"
            ))
        self.assertTrue(
            AuditLog.objects.filter(
                action="fraud_flag", metadata__reason="duplicate_device_fingerprint"
            ).exists()
        )

    def test_fingerprint_from_header(self):
        from fann.qualification.models import RoleProfile

        u = self._mk("fphdr@test.local")
        record_signup_fingerprint(
            u, _fake_request(meta_extra={"HTTP_X_DEVICE_FINGERPRINT": "HDR-99"})
        )
        rp = RoleProfile.objects.get(user=u)
        self.assertEqual((rp.details or {}).get("device_fingerprint"), "HDR-99")


# --------------------------------------------------------------------------- #
# Enh-3 — self-service erasure
# --------------------------------------------------------------------------- #
class SelfErasureTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="erase.me@test.local", password="x", role="Collector",
            first_name="Real", last_name="Name", phone_number="+15551234",
        )

    def test_requires_confirm_token(self):
        self.client.force_authenticate(self.user)
        r = self.client.post("/api/qualification/me/erase", {}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_erasure_scrubs_pii_and_deactivates(self):
        self.client.force_authenticate(self.user)
        r = self.client.post(
            "/api/qualification/me/erase", {"confirm": "ERASE"}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_deleted)
        self.assertFalse(self.user.is_active)
        self.assertFalse(self.user.is_verify)
        self.assertEqual(self.user.first_name, "")
        self.assertNotIn("erase.me", self.user.email)
        self.assertIn("deleted.tryfann.invalid", self.user.email)
        self.assertTrue(
            AuditLog.objects.filter(action="self_erasure", target_id=str(self.user.pk)).exists()
        )

    def test_superuser_cannot_self_erase(self):
        admin = User.objects.create_user(
            email="root@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        self.client.force_authenticate(admin)
        r = self.client.post(
            "/api/qualification/me/erase", {"confirm": "ERASE"}, format="json"
        )
        self.assertEqual(r.status_code, 400)


# --------------------------------------------------------------------------- #
# P1-9 — curator invitation
# --------------------------------------------------------------------------- #
class CuratorInvitationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super = User.objects.create_user(
            email="s.p19@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        self.staff = User.objects.create_user(
            email="staff.p19@test.local", password="x", role="Collector", is_staff=True,
        )
        self.invitee = User.objects.create_user(
            email="invitee.p19@test.local", password="x", role="Collector",
        )

    def test_non_superuser_cannot_issue(self):
        self.client.force_authenticate(self.staff)
        r = self.client.post(
            "/api/qualification/admin/curator-invitations",
            {"email": "x@y.com"}, format="json",
        )
        self.assertEqual(r.status_code, 403)

    def test_issue_then_accept_promotes_to_curator(self):
        self.client.force_authenticate(self.super)
        r = self.client.post(
            "/api/qualification/admin/curator-invitations",
            {"email": "invitee.p19@test.local"}, format="json",
        )
        self.assertEqual(r.status_code, 200)
        token = r.json()["data"]["token"]

        self.client.force_authenticate(self.invitee)
        r2 = self.client.post(
            "/api/qualification/curator-invitations/accept",
            {"token": token}, format="json",
        )
        self.assertEqual(r2.status_code, 200)
        self.invitee.refresh_from_db()
        self.assertEqual(self.invitee.role, "Curator")
        inv = CuratorInvitation.objects.get(token=token)
        self.assertEqual(inv.accepted_by_id, self.invitee.id)

    def test_revoked_token_cannot_be_accepted(self):
        inv = CuratorInvitation.objects.create(
            token="revoked-tok", email="", issued_by=self.super,
            expires_at=timezone.now() + timezone.timedelta(days=5), revoked=True,
        )
        self.client.force_authenticate(self.invitee)
        r = self.client.post(
            "/api/qualification/curator-invitations/accept",
            {"token": inv.token}, format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_expired_token_cannot_be_accepted(self):
        inv = CuratorInvitation.objects.create(
            token="expired-tok", email="", issued_by=self.super,
            expires_at=timezone.now() - timezone.timedelta(days=1),
        )
        self.client.force_authenticate(self.invitee)
        r = self.client.post(
            "/api/qualification/curator-invitations/accept",
            {"token": inv.token}, format="json",
        )
        self.assertEqual(r.status_code, 400)


# --------------------------------------------------------------------------- #
# P1-11 — founding caps + truthful counters
# --------------------------------------------------------------------------- #
class FoundingCapTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super = User.objects.create_user(
            email="s.p111@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )

    def test_admin_sets_cap_and_counters_are_truthful(self):
        # Two real verified_member entries.
        for i in range(2):
            u = User.objects.create_user(
                email=f"vm{i}.p111@test.local", password="x", role="Collector"
            )
            services.ensure_qualification(u)
            WhitelistEntry.objects.filter(user=u).update(tier=WhitelistEntry.VERIFIED_MEMBER)

        self.client.force_authenticate(self.super)
        r = self.client.post(
            "/api/qualification/admin/founding-caps",
            {"tier": WhitelistEntry.VERIFIED_MEMBER, "cap": 5}, format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(FoundingTierCap.objects.get(tier=WhitelistEntry.VERIFIED_MEMBER).cap, 5)

        # Public status endpoint reports the REAL fill, not a fabricated figure.
        r2 = self.client.get("/api/qualification/founding/status")
        self.assertEqual(r2.status_code, 200)
        tiers = {t["tier"]: t for t in r2.json()["data"]["tiers"]}
        vm = tiers[WhitelistEntry.VERIFIED_MEMBER]
        self.assertEqual(vm["cap"], 5)
        self.assertEqual(vm["filled"], 2)
        self.assertEqual(vm["remaining"], 3)

    def test_cap_rejects_negative(self):
        self.client.force_authenticate(self.super)
        r = self.client.post(
            "/api/qualification/admin/founding-caps",
            {"tier": WhitelistEntry.VERIFIED_MEMBER, "cap": -1}, format="json",
        )
        self.assertEqual(r.status_code, 400)


# --------------------------------------------------------------------------- #
# P1-12 — waitlist application status
# --------------------------------------------------------------------------- #
class WaitlistStatusTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super = User.objects.create_user(
            email="s.p112@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        self.applicant = User.objects.create_user(
            email="ap.p112@test.local", password="x", role="Artist"
        )
        services.ensure_qualification(self.applicant)

    def test_transition_logs_and_changes(self):
        entry, changed = services.transition_waitlist_status(
            self.applicant, WhitelistEntry.VERIFIED, reason="email_verified"
        )
        self.assertTrue(changed)
        self.assertEqual(entry.application_status, WhitelistEntry.VERIFIED)
        log = AuditLog.objects.filter(
            action="waitlist_status_change", target_id=str(self.applicant.pk)
        ).latest("id")
        self.assertEqual(log.metadata.get("to"), WhitelistEntry.VERIFIED)

    def test_admin_reject_requires_reason(self):
        self.client.force_authenticate(self.super)
        r = self.client.post(
            "/api/qualification/admin/waitlist-status",
            {"user_id": self.applicant.id, "status": WhitelistEntry.REJECTED},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_admin_override_with_reason(self):
        self.client.force_authenticate(self.super)
        r = self.client.post(
            "/api/qualification/admin/waitlist-status",
            {"user_id": self.applicant.id, "status": WhitelistEntry.REJECTED,
             "reason": "incomplete portfolio"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.applicant.whitelist_entry.refresh_from_db()
        self.assertEqual(
            self.applicant.whitelist_entry.application_status, WhitelistEntry.REJECTED
        )

    def test_staff_non_superuser_cannot_override(self):
        staff = User.objects.create_user(
            email="staff.p112@test.local", password="x", role="Collector", is_staff=True,
        )
        self.client.force_authenticate(staff)
        r = self.client.post(
            "/api/qualification/admin/waitlist-status",
            {"user_id": self.applicant.id, "status": WhitelistEntry.APPROVED},
            format="json",
        )
        self.assertEqual(r.status_code, 403)


# --------------------------------------------------------------------------- #
# P1-6 — collector preferences: queue boost + segmentation
# --------------------------------------------------------------------------- #
class CollectorPreferenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.super = User.objects.create_user(
            email="s.p16@test.local", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )
        self.collector = User.objects.create_user(
            email="c.p16@test.local", password="x", role="Collector"
        )
        services.ensure_qualification(self.collector)

    def _complete_profile(self, user):
        IntersetReward.objects.create(
            user=user,
            art_style=["abstract"],
            price_interset="1k-5k",
            mediums=["painting"],
            preferred_spaces=["home"],
            buying_frequency="regular",
        )

    def test_complete_profile_earns_boost_once(self):
        self._complete_profile(self.collector)
        services.boost_for_collector_preferences(self.collector)
        services.boost_for_collector_preferences(self.collector)  # idempotent
        n = PointsLedger.objects.filter(
            user=self.collector, reason="collector_preferences_complete"
        ).count()
        self.assertEqual(n, 1)

    def test_incomplete_profile_no_boost(self):
        IntersetReward.objects.create(
            user=self.collector, art_style=["abstract"], price_interset="1k-5k"
        )  # missing mediums/spaces/frequency
        services.boost_for_collector_preferences(self.collector)
        self.assertFalse(
            PointsLedger.objects.filter(
                user=self.collector, reason="collector_preferences_complete"
            ).exists()
        )

    def test_segmentation_endpoint_aggregates(self):
        self._complete_profile(self.collector)
        self.client.force_authenticate(self.super)
        r = self.client.get("/api/qualification/admin/collector-segments")
        self.assertEqual(r.status_code, 200)
        data = r.json()["data"]
        self.assertEqual(data["total_profiles"], 1)
        self.assertEqual(data["mediums"].get("painting"), 1)
        self.assertEqual(data["buying_frequency"].get("regular"), 1)
