# fann/notifications/services.py
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification


class EmailService:
    """Service for sending emails with templates"""

    @staticmethod
    def send_email(subject, template_name, context, recipient_email):
        """
        Send templated email
        Args:
            subject: Email subject
            template_name: Template file name (e.g., 'artwork_uploaded.html')
            context: Dictionary with template variables
            recipient_email: Recipient's email address
        """
        html_message = render_to_string(f"emails/{template_name}", context)
        plain_message = render_to_string(
            f'emails/{template_name.replace(".html", ".txt")}', context
        )

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )


class NotificationService:
    """Service for creating and sending notifications"""

    @staticmethod
    def create_notification(
        recipient,
        message,
        notif_type="general",
        send_email=False,
        email_subject=None,
        email_template=None,
        email_context=None,
    ):
        """
        Create notification and optionally send email
        Args:
            recipient: User object
            message: Notification message
            notif_type: Type of notification
            send_email: Whether to send email
            email_subject: Email subject if send_email is True
            email_template: Email template name if send_email is True
            email_context: Email context dict if send_email is True
        """
        # Create notification in database
        notification = Notification.objects.create(
            recipient=recipient, message=message, type=notif_type
        )

        # Send via WebSocket
        channel_layer = get_channel_layer()
        unread_count = Notification.objects.filter(
            recipient=recipient, is_read=False
        ).count()

        async_to_sync(channel_layer.group_send)(
            f"notifications_{recipient.id}",
            {
                "type": "send_notification",
                "content": {
                    "message": message,
                    "type": notif_type,
                    "unread_count": unread_count,
                    "created_at": notification.created_at.isoformat(),
                },
            },
        )

        # Send email if requested
        if send_email and email_subject and email_template and email_context:
            send_notification_email.delay(
                email_subject, email_template, email_context, recipient.email
            )

        return notification

    @staticmethod
    def notify_multiple_users(
        recipients,
        message,
        notif_type="general",
        send_email=False,
        email_subject=None,
        email_template=None,
        email_context_func=None,
    ):
        """
        Send notification to multiple users
        Args:
            recipients: QuerySet or list of User objects
            message: Notification message (can be a function that takes user as arg)
            notif_type: Type of notification
            send_email: Whether to send email
            email_subject: Email subject if send_email is True
            email_template: Email template name if send_email is True
            email_context_func: Function that takes user and returns context dict
        """
        for recipient in recipients:
            msg = message(recipient) if callable(message) else message
            context = email_context_func(recipient) if email_context_func else {}

            NotificationService.create_notification(
                recipient=recipient,
                message=msg,
                notif_type=notif_type,
                send_email=send_email,
                email_subject=email_subject,
                email_template=email_template,
                email_context=context,
            )


@shared_task
def send_notification_email(subject, template_name, context, recipient_email):
    """Celery task for sending emails asynchronously"""
    EmailService.send_email(subject, template_name, context, recipient_email)
