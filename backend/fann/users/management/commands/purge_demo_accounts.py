"""
P0-3 — Purge demo/QA + test-harness accounts from the datastore.

This is a REAL datastore removal, not a query filter. By default it runs a
DRY-RUN and soft-deletes (is_active=False, is_deleted=True, is_verify=False) so
the change is reversible; pass --hard for an actual DELETE. Superusers are
protected by default (so the operational admin@ is never removed) unless
--include-superusers is given.

Targets:
  * Demo role identities: artist@ / gallery@ / collector@ / curator@ /
    ambassador@ / investor@ @tryfann.com
  * Test-harness accounts: flow_/flow2_/closed_/intdb_/fixed_/maillive_/
    pgreal_/staffonly_/reftest_  and any address containing "+tf"

Usage:
  manage.py purge_demo_accounts                 # dry-run, shows what it would do
  manage.py purge_demo_accounts --execute       # soft-delete (reversible)
  manage.py purge_demo_accounts --execute --hard  # hard DELETE
"""
import re

from django.core.management.base import BaseCommand
from django.db.models import Q

from fann.users.models import User

DEMO_ROLE_EMAILS = [
    "artist@tryfann.com",
    "gallery@tryfann.com",
    "collector@tryfann.com",
    "curator@tryfann.com",
    "ambassador@tryfann.com",
    "investor@tryfann.com",
]

HARNESS_REGEX = r"^(flow|flow2|closed|intdb|fixed|maillive|pgreal|staffonly|reftest)_"


def demo_and_harness_qs(include_superusers=False):
    """Every demo/harness account. Excludes superusers unless asked."""
    qs = User.objects.filter(
        Q(email__in=DEMO_ROLE_EMAILS)
        | Q(email__iregex=HARNESS_REGEX)
        | Q(email__icontains="+tf")
    )
    if not include_superusers:
        qs = qs.exclude(is_superuser=True)
    return qs


class Command(BaseCommand):
    help = "Remove/deactivate demo + test-harness accounts (real datastore removal)."

    def add_arguments(self, parser):
        parser.add_argument("--execute", action="store_true", help="Apply changes (default is dry-run).")
        parser.add_argument("--hard", action="store_true", help="Hard DELETE instead of soft-delete.")
        parser.add_argument("--include-superusers", action="store_true", help="Also target superuser accounts (dangerous).")

    def handle(self, *args, **opts):
        qs = demo_and_harness_qs(include_superusers=opts["include_superusers"])
        rows = list(qs.values_list("id", "email", "is_superuser"))
        self.stdout.write(f"Matched {len(rows)} demo/harness account(s):")
        for _id, email, is_su in rows:
            self.stdout.write(f"  - #{_id} {email}{' (SUPERUSER)' if is_su else ''}")

        if not rows:
            self.stdout.write(self.style.SUCCESS("Nothing to purge — datastore is clean."))
            return

        if not opts["execute"]:
            self.stdout.write(self.style.WARNING("DRY-RUN — no changes made. Re-run with --execute."))
            return

        if opts["hard"]:
            deleted, _ = qs.delete()
            self.stdout.write(self.style.SUCCESS(f"HARD-DELETED {len(rows)} account(s) (objects removed: {deleted})."))
        else:
            updated = qs.update(is_active=False, is_deleted=True, is_verify=False)
            self.stdout.write(self.style.SUCCESS(f"Soft-deleted {updated} account(s) (is_active=False, is_deleted=True)."))
