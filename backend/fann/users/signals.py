from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import User, KYCSubmission
from fann.notifications.tasks import (
    notify_superadmin_new_user,
    notify_user_blocked,
    notify_user_kyc_rejected,
    notify_user_kyc_approved,
)


# @receiver(post_save, sender=User)
# def send_admin_notification_on_registration(sender, instance, created, **kwargs):
#     if created:
#         notify_superadmin_new_user.delay(instance.id)


@receiver(post_save, sender=User)
def user_created_handler(sender, instance, created, **kwargs):
    if created:
        notify_superadmin_new_user.delay(user_id=instance.id)


@receiver(post_save, sender=KYCSubmission)
def kyc_status_handler(sender, instance, created, **kwargs):
    """
    Notify the user when their KYC is approved or rejected.
    """
    if created:
        return  # only handle updates, not new pending submissions

    if instance.status == "Approved":
        notify_user_kyc_approved.delay(user_id=instance.user.id)

    elif instance.status == "Rejected":
        # Optional: store rejection reason in instance or pass a generic one
        reason = getattr(instance, "admin_remarks", "Your KYC was rejected.")
        notify_user_kyc_rejected.delay(
            user_id=instance.user.id,
            reason=reason,
        )


# ✅ When a user account is blocked (is_active set to False)
@receiver(post_save, sender=User)
def user_block_handler(sender, instance, **kwargs):
    """
    Notify the user if their account is blocked.
    """
    # Only act if the user was active before and now is inactive
    if not instance.is_active:
        reason = getattr(instance, "block_reason", "Violation of platform rules.")
        notify_user_blocked.delay(
            user_id=instance.id,
            reason=reason,
        )
