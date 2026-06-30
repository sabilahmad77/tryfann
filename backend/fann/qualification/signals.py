"""
Qualification hooks. All bodies are guarded so they can NEVER break the core
auth/registration flow — a failure here is logged, not raised.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from fann.users.models import KYCSubmission, KYCVerification, User
from fann.qualification import services

logger = logging.getLogger(__name__)


@receiver(post_save, sender=User, dispatch_uid="qualification_user_saved")
def qualification_on_user_saved(sender, instance, created, **kwargs):
    try:
        if created:
            services.ensure_qualification(instance)
            services.award_points(
                instance,
                services.SIGNUP_POINTS,
                "signup",
                dedupe_key=f"signup:{instance.pk}",
            )
        # Verified-referral credit becomes eligible once the referee verifies.
        if getattr(instance, "is_verify", False):
            services.credit_referral(instance)
        services.recompute(instance)
    except Exception:
        logger.exception(
            "qualification user hook failed for user=%s", getattr(instance, "pk", None)
        )


def _on_kyc(user):
    try:
        services.award_points(
            user, services.KYC_POINTS, "kyc_verified", dedupe_key=f"kyc:{user.pk}"
        )
        services.recompute(user)
    except Exception:
        logger.exception(
            "qualification kyc hook failed for user=%s", getattr(user, "pk", None)
        )


@receiver(post_save, sender=KYCVerification, dispatch_uid="qualification_kyc_verification")
def qualification_on_kyc_verification(sender, instance, **kwargs):
    approved = getattr(instance, "status", "") == "Approved" or getattr(
        instance, "is_kyc_completed", False
    )
    if approved and instance.user_id:
        _on_kyc(instance.user)


@receiver(post_save, sender=KYCSubmission, dispatch_uid="qualification_kyc_submission")
def qualification_on_kyc_submission(sender, instance, **kwargs):
    if getattr(instance, "status", "") == "Approved" and instance.user_id:
        _on_kyc(instance.user)
