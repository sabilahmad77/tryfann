"""
P0-3: demo/harness account purge is a real datastore removal + superusers are
protected + the fake-data seed command refuses to run in production.
"""
from io import StringIO

from django.core.management import call_command, get_commands
from django.test import TestCase

from fann.users.models import User


class PurgeDemoAccountsTests(TestCase):
    def setUp(self):
        self.demo = User.objects.create_user(email="artist@tryfann.com", password="x", role="Artist")
        self.harness = User.objects.create_user(email="flow_123@tryfann.com", password="x", role="Artist")
        self.tf = User.objects.create_user(email="me+tf9@gmail.com", password="x", role="Artist")
        self.real = User.objects.create_user(email="realcollector@example.com", password="x", role="Collector")
        self.superadmin = User.objects.create_user(
            email="admin@tryfann.com", password="x", role="Collector",
            is_staff=True, is_superuser=True,
        )

    def test_dry_run_changes_nothing(self):
        call_command("purge_demo_accounts", stdout=StringIO())
        for u in (self.demo, self.harness, self.tf):
            u.refresh_from_db()
            self.assertTrue(u.is_active)
            self.assertFalse(u.is_deleted)

    def test_execute_soft_deletes_demo_and_harness_only(self):
        call_command("purge_demo_accounts", "--execute", stdout=StringIO())
        for u in (self.demo, self.harness, self.tf):
            u.refresh_from_db()
            self.assertFalse(u.is_active, f"{u.email} should be deactivated")
            self.assertTrue(u.is_deleted, f"{u.email} should be soft-deleted")
        # real user + superuser untouched
        self.real.refresh_from_db()
        self.superadmin.refresh_from_db()
        self.assertTrue(self.real.is_active)
        self.assertTrue(self.superadmin.is_active, "superuser must be protected by default")

    def test_hard_delete_removes_rows(self):
        call_command("purge_demo_accounts", "--execute", "--hard", stdout=StringIO())
        self.assertFalse(User.objects.filter(email="artist@tryfann.com").exists())
        self.assertFalse(User.objects.filter(email="flow_123@tryfann.com").exists())
        self.assertTrue(User.objects.filter(email="admin@tryfann.com").exists())

    def test_fake_data_seed_command_removed(self):
        # P0-3: the fake-analytics-data generator was deleted so no command can
        # ever seed demo data into prod.
        self.assertNotIn("generate_analytics_data", get_commands())
