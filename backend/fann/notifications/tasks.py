# fann/notifications/tasks.py

from __future__ import annotations

from celery import shared_task
from dataclasses import dataclass
from typing import Optional, Dict, Any

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from fann.notifications.models import Notification
from fann.users.models import User


# ---------- Utilities ----------


def _platform_url() -> str:
    """
    Best-effort platform/base URL for links inside emails.
    Looks for SITE_URL, then FRONTEND_URL, then builds a sensible default.
    """
    return (
        getattr(settings, "SITE_URL", None)
        or getattr(settings, "FRONTEND_URL", None)
        or "https://fann.example.com"
    )


def _from_email() -> str:
    """
    Sender address for emails.
    """
    default_from = getattr(settings, "DEFAULT_FROM_EMAIL", None)
    if default_from:
        return default_from
    domain = _platform_url().split("://")[-1]
    return f"FANN <no-reply@{domain}>"


def _render_and_send_email(
    *,
    subject: str,
    to_email: str,
    template_name: str,
    context: Dict[str, Any],
) -> None:
    """
    Renders emails/{template_name}.html and .txt and sends multipart/alternative.
    """
    html_path = f"emails/{template_name}.html"
    txt_path = f"emails/{template_name}.txt"

    # Always provide platform_url in context for the templates
    ctx = {"platform_url": _platform_url(), **context}

    html_body = render_to_string(html_path, ctx)
    try:
        text_body = render_to_string(txt_path, ctx)
    except Exception:
        # Fallback to plain text from HTML if .txt template is missing for some reason
        text_body = strip_tags(html_body)

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        to=[to_email],
        from_email=_from_email(),
    )
    email.attach_alternative(html_body, "text/html")
    email.send(fail_silently=True)


def _notify_ws_and_db(recipient: User, message: str, notif_type: str) -> None:
    """
    Creates a Notification row and pushes a Channels message to the user's group.
    """
    note = Notification.objects.create(
        recipient=recipient,
        message=message,
        type=notif_type,
    )

    channel_layer = get_channel_layer()
    unread_count = Notification.objects.filter(
        recipient=recipient, is_read=False
    ).count()

    # Send via WebSocket – group name aligned with your existing consumer
    async_to_sync(channel_layer.group_send)(
        f"notifications_{recipient.id}",
        {
            "type": "send_notification",
            "content": {
                "message": message,
                "type": notif_type,
                "id": note.id,
                "unread_count": unread_count,
            },
        },
    )


@dataclass
class _Person:
    id: int
    name: str
    email: str

    @classmethod
    def from_user_id(cls, user_id: int) -> "_Person":
        u = User.objects.get(id=user_id)
        return cls(
            id=u.id,
            name=(getattr(u, "full_name", None) or u.get_full_name() or u.email),
            email=u.email,
        )


# ---------- Superadmin: New user (already in your file; kept and upgraded) ----------


@shared_task
def notify_superadmin_new_user(user_id: int) -> None:
    new_user = User.objects.get(id=user_id)
    superadmins = User.objects.filter(role="SuperAdmin")

    message = f"New user {new_user.full_name or new_user.email} registered. Please review KYC."
    for admin in superadmins:
        # DB + WebSocket
        _notify_ws_and_db(admin, message, "kyc_approval")

        # Email
        if admin.email:
            _render_and_send_email(
                subject="New User Registration - KYC Review Required",
                to_email=admin.email,
                template_name="admin_new_user",
                context={
                    "admin_name": admin.full_name or admin.email,
                    "new_user_name": new_user.full_name or new_user.email,
                    "new_user_email": new_user.email,
                    "user_id": new_user.id,
                },
            )


# ---------- Artist notifications ----------


@shared_task
def notify_artwork_uploaded(
    artist_id: int, artwork_id: int, artwork_title: str
) -> None:
    artist = _Person.from_user_id(artist_id)
    msg = f"Artwork '{artwork_title}' has been uploaded."
    _notify_ws_and_db(User.objects.get(id=artist.id), msg, "artwork")

    if artist.email:
        _render_and_send_email(
            subject="Artwork Uploaded Successfully!",
            to_email=artist.email,
            template_name="artwork_uploaded",
            context={
                "artist_name": artist.name,
                "artwork_id": artwork_id,
                "artwork_title": artwork_title,
            },
        )


@shared_task
def notify_artwork_sold(
    artist_id: int,
    artwork_title: str,
    buyer_name: str,
    sale_price: float,
) -> None:
    artist = _Person.from_user_id(artist_id)
    msg = f"Your artwork '{artwork_title}' was sold to {buyer_name} for ${sale_price}."
    _notify_ws_and_db(User.objects.get(id=artist.id), msg, "sale")

    if artist.email:
        _render_and_send_email(
            subject="Congratulations! Your Artwork Sold!",
            to_email=artist.email,
            template_name="artwork_sold",
            context={
                "artist_name": artist.name,
                "artwork_title": artwork_title,
                "buyer_name": buyer_name,
                "sale_price": sale_price,
            },
        )


@shared_task
def notify_offer_received(
    artist_id: int,
    artwork_title: str,
    offer_amount: float,
    customer_name: str,
) -> None:
    artist = _Person.from_user_id(artist_id)
    msg = f"New offer ${offer_amount} on '{artwork_title}' from {customer_name}."
    _notify_ws_and_db(User.objects.get(id=artist.id), msg, "offer")

    if artist.email:
        _render_and_send_email(
            subject="New Offer Received!",
            to_email=artist.email,
            template_name="offer_received",
            context={
                "artist_name": artist.name,
                "artwork_title": artwork_title,
                "offer_amount": offer_amount,
                "customer_name": customer_name,
            },
        )


# ---------- Customer notifications ----------


@shared_task
def notify_purchase_complete(
    customer_id: int,
    order_id: int,
    artwork_title: str,
    amount: float,
) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = f"Purchase complete: Order #{order_id} for '{artwork_title}'."
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "purchase")

    if customer.email:
        _render_and_send_email(
            subject="Purchase Completed Successfully!",
            to_email=customer.email,
            template_name="purchase_complete",
            context={
                "customer_name": customer.name,
                "order_id": order_id,
                "artwork_title": artwork_title,
                "amount": amount,
            },
        )


@shared_task
def notify_bid_placed(customer_id: int, auction_title: str, bid_amount: float) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = f"Bid placed: ${bid_amount} on '{auction_title}'."
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "auction")

    if customer.email:
        _render_and_send_email(
            subject="Bid Placed Successfully!",
            to_email=customer.email,
            template_name="bid_placed",
            context={
                "customer_name": customer.name,
                "auction_title": auction_title,
                "bid_amount": bid_amount,
            },
        )


@shared_task
def notify_bid_outbid(
    customer_id: int, auction_title: str, new_bid_amount: float
) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = (
        f"You've been outbid on '{auction_title}'. Current highest: ${new_bid_amount}."
    )
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "auction")

    if customer.email:
        _render_and_send_email(
            subject="You've Been Outbid",
            to_email=customer.email,
            template_name="bid_outbid",
            context={
                "customer_name": customer.name,
                "auction_title": auction_title,
                "new_bid_amount": new_bid_amount,
            },
        )


@shared_task
def notify_auction_won(
    customer_id: int, auction_title: str, winning_bid: float
) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = f"You won the auction '{auction_title}' with a bid of ${winning_bid}!"
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "auction")

    if customer.email:
        _render_and_send_email(
            subject="Congratulations! You Won the Auction!",
            to_email=customer.email,
            template_name="auction_won",
            context={
                "customer_name": customer.name,
                "auction_title": auction_title,
                "winning_bid": winning_bid,
            },
        )


@shared_task
def notify_offer_accepted(customer_id: int, artwork_title: str) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = f"Your offer for '{artwork_title}' was accepted."
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "offer")

    if customer.email:
        _render_and_send_email(
            subject="Your Offer Has Been Accepted!",
            to_email=customer.email,
            template_name="offer_accepted",
            context={
                "customer_name": customer.name,
                "artwork_title": artwork_title,
            },
        )


@shared_task
def notify_offer_rejected(customer_id: int, artwork_title: str) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = f"Your offer for '{artwork_title}' was declined."
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "offer")

    if customer.email:
        _render_and_send_email(
            subject="Offer Update",
            to_email=customer.email,
            template_name="offer_rejected",
            context={
                "customer_name": customer.name,
                "artwork_title": artwork_title,
            },
        )


@shared_task
def notify_infraction(customer_id: int, infraction_reason: str) -> None:
    customer = _Person.from_user_id(customer_id)
    msg = f"Infraction issued: {infraction_reason}"
    _notify_ws_and_db(User.objects.get(id=customer.id), msg, "infraction")

    if customer.email:
        _render_and_send_email(
            subject="Infraction Notice",
            to_email=customer.email,
            template_name="infraction",
            context={
                "customer_name": customer.name,
                "reason": infraction_reason,
            },
        )


# ---------- Disputes (both sides + admins) ----------


@shared_task
def notify_dispute_opened(
    artist_id: int,
    customer_id: int,
    dispute_id: int,
    order_id: int,
) -> None:
    # Buyer view
    buyer = _Person.from_user_id(customer_id)
    buyer_msg = f"Your dispute #{dispute_id} for Order #{order_id} has been created."
    _notify_ws_and_db(User.objects.get(id=buyer.id), buyer_msg, "dispute")
    if buyer.email:
        _render_and_send_email(
            subject="Dispute Created",
            to_email=buyer.email,
            template_name="dispute_opened",
            context={
                "user_name": buyer.name,
                "role": "buyer",
                "dispute_id": dispute_id,
                "order_id": order_id,
            },
        )

    # Artist view
    artist = _Person.from_user_id(artist_id)
    artist_msg = (
        f"A dispute #{dispute_id} has been opened on your sale (Order #{order_id})."
    )
    _notify_ws_and_db(User.objects.get(id=artist.id), artist_msg, "dispute")
    if artist.email:
        _render_and_send_email(
            subject="Dispute Opened",
            to_email=artist.email,
            template_name="dispute_opened",
            context={
                "user_name": artist.name,
                "role": "seller",
                "dispute_id": dispute_id,
                "order_id": order_id,
            },
        )


@shared_task
def notify_dispute_reply(
    artist_id: int,
    dispute_id: int,
    dispute_title: str,
) -> None:
    # This task name suggests we're notifying the "other party" (could be artist or buyer).
    recipient = _Person.from_user_id(artist_id)
    msg = f"New reply on dispute #{dispute_id}: {dispute_title}"
    _notify_ws_and_db(User.objects.get(id=recipient.id), msg, "dispute")

    if recipient.email:
        _render_and_send_email(
            subject="New Reply on Your Dispute",
            to_email=recipient.email,
            template_name="dispute_reply",
            context={
                "user_name": recipient.name,
                "dispute_id": dispute_id,
                "dispute_title": dispute_title,
            },
        )


@shared_task
def notify_dispute_resolved(
    user_id: int,
    dispute_id: int,
    resolution: str,
) -> None:
    person = _Person.from_user_id(user_id)
    msg = f"Dispute #{dispute_id} resolved: {resolution}"
    _notify_ws_and_db(User.objects.get(id=person.id), msg, "dispute")

    if person.email:
        _render_and_send_email(
            subject="Dispute Resolved",
            to_email=person.email,
            template_name="dispute_resolved",
            context={
                "user_name": person.name,
                "dispute_id": dispute_id,
                "resolution": resolution,
            },
        )


@shared_task
def notify_superadmin_dispute(dispute_id: int, order_id: int) -> None:
    admins = User.objects.filter(role="SuperAdmin")
    for admin in admins:
        msg = f"New dispute #{dispute_id} (Order #{order_id}) requires attention."
        _notify_ws_and_db(admin, msg, "dispute_admin")

        if admin.email:
            _render_and_send_email(
                subject="New Dispute Requires Attention",
                to_email=admin.email,
                template_name="admin_dispute",
                context={
                    "admin_name": admin.full_name or admin.email,
                    "dispute_id": dispute_id,
                    "order_id": order_id,
                },
            )


# ---------- KYC & Account ----------


@shared_task
def notify_user_kyc_approved(user_id: int) -> None:
    person = _Person.from_user_id(user_id)
    msg = "Your KYC has been approved."
    _notify_ws_and_db(User.objects.get(id=person.id), msg, "kyc")

    if person.email:
        _render_and_send_email(
            subject="KYC Approved!",
            to_email=person.email,
            template_name="kyc_approved",
            context={"user_name": person.name},
        )


@shared_task
def notify_user_kyc_rejected(user_id: int, reason: str) -> None:
    person = _Person.from_user_id(user_id)
    msg = f"KYC rejected: {reason}"
    _notify_ws_and_db(User.objects.get(id=person.id), msg, "kyc")

    if person.email:
        _render_and_send_email(
            subject="KYC Verification Update",
            to_email=person.email,
            template_name="kyc_rejected",
            context={
                "user_name": person.name,
                "reason": reason,
            },
        )


@shared_task
def notify_user_blocked(user_id: int, reason: str) -> None:
    person = _Person.from_user_id(user_id)
    msg = f"Your account has been blocked. Reason: {reason}"
    _notify_ws_and_db(User.objects.get(id=person.id), msg, "account")

    if person.email:
        _render_and_send_email(
            subject="Account Blocked",
            to_email=person.email,
            template_name="account_blocked",
            context={
                "user_name": person.name,
                "reason": reason,
            },
        )


# ---------- Payments / Refunds ----------


@shared_task
def notify_refund_processed(user_id: int, order_id: int, amount: float) -> None:
    person = _Person.from_user_id(user_id)
    msg = f"Refund processed for Order #{order_id}: ${amount}"
    _notify_ws_and_db(User.objects.get(id=person.id), msg, "refund")

    if person.email:
        _render_and_send_email(
            subject="Refund Processed",
            to_email=person.email,
            template_name="refund_processed",
            context={
                "user_name": person.name,
                "order_id": order_id,
                "amount": amount,
            },
        )
