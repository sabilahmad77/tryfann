from django.db.models.signals import post_save
from django.dispatch import receiver
from fann.artist.models import (
    Art,
    Order,
    AuctionBid,
    OrderDispute,
    Auction,
    DisputeMessage,
)
from fann.notifications.tasks import (
    notify_artwork_uploaded,
    notify_artwork_sold,
    notify_purchase_complete,
    notify_bid_placed,
    notify_bid_outbid,
    notify_superadmin_dispute,
    notify_dispute_opened,
    notify_refund_processed,
    notify_auction_won,
    notify_dispute_resolved,
    notify_dispute_reply,
)


@receiver(post_save, sender=Art)
def artwork_uploaded_handler(sender, instance, created, **kwargs):
    """
    Automatically send notification & email when an artist uploads new artwork.
    """
    if created:
        notify_artwork_uploaded.delay(
            artist_id=instance.artist.id,
            artwork_id=instance.id,
            artwork_title=instance.title,
        )


@receiver(post_save, sender=Order)
def order_paid_handler(sender, instance, created, **kwargs):
    """
    When an order is created or updated to 'Paid' or 'Completed',
    notify both the artist and the buyer.
    """
    # We only want to notify once — after the order has been successfully paid
    if instance.payment_status in ["Authorized", "Captured"]:
        # Notify the artist
        notify_artwork_sold.delay(
            artist_id=instance.artist.id,
            artwork_title=instance.art.title,
            buyer_name=instance.buyer.full_name or instance.buyer.email,
            sale_price=float(instance.total),
        )

        # Notify the buyer
        notify_purchase_complete.delay(
            customer_id=instance.buyer.id,
            order_id=instance.id,
            artwork_title=instance.art.title,
            amount=float(instance.total),
        )


@receiver(post_save, sender=AuctionBid)
def handle_new_bid(sender, instance, created, **kwargs):
    """
    Triggered whenever a new bid is created.
    Sends:
    - notify_bid_placed → to the current bidder
    - notify_bid_outbid → to the previous highest bidder
    """
    if not created:
        return  # we only act when a new bid is first created

    auction = instance.auction

    # --- 1️⃣ Find previous highest bidder ---
    previous_highest_bid = (
        auction.auction_bids.exclude(id=instance.id).order_by("-amount").first()
    )

    # --- 2️⃣ Notify the new bidder ---
    notify_bid_placed.delay(
        customer_id=instance.bidder.id,
        auction_title=auction.art.title,
        bid_amount=instance.amount,
    )

    # --- 3️⃣ Notify the previous bidder (if any) ---
    if previous_highest_bid:
        previous_user = previous_highest_bid.bidder
        notify_bid_outbid.delay(
            customer_id=previous_user.id,
            auction_title=auction.art.title,
            new_bid_amount=instance.amount,
        )


@receiver(post_save, sender=OrderDispute)
def dispute_created_handler(sender, instance, created, **kwargs):
    """
    Triggered when a new dispute is filed by a buyer.
    Automatically notifies:
    - The seller (artist)
    - The buyer (for confirmation)
    - All SuperAdmins
    """
    if not created:
        return  # only act when first created

    dispute = instance
    order = dispute.order

    # Safety: skip if missing buyer/seller info
    if not order or not dispute.buyer or not dispute.seller:
        return

    # Notify both parties (buyer + seller)
    notify_dispute_opened.delay(
        artist_id=dispute.seller.id,
        customer_id=dispute.buyer.id,
        dispute_id=dispute.id,
        order_id=order.id,
    )

    # Notify superadmins for review
    notify_superadmin_dispute.delay(
        dispute_id=dispute.id,
        order_id=order.id,
    )


@receiver(post_save, sender=Order)
def refund_processed_handler(sender, instance, **kwargs):
    """
    Automatically notify the buyer when a refund is processed.
    Triggered when payment_status changes to 'Refunded'.
    """
    if instance.payment_status == "Refunded":
        notify_refund_processed.delay(
            user_id=instance.buyer.id,
            order_id=instance.id,
            amount=float(instance.total),
        )


@receiver(post_save, sender=Auction)
def auction_end_handler(sender, instance, **kwargs):
    """
    When an auction's status changes to 'Ended', automatically notify the winner.
    """
    # Only act when auction ends and has a winner
    if instance.status.lower() == "ended" and instance.winner:
        winning_bid = instance.auction_bids.order_by("-amount").first() or None
        if not winning_bid:
            return

        notify_auction_won.delay(
            customer_id=instance.winner.id,
            auction_title=instance.art.title,
            winning_bid=winning_bid.amount,
        )


@receiver(post_save, sender=OrderDispute)
def dispute_resolved_handler(sender, instance, **kwargs):
    """
    Automatically notify both buyer and seller when a dispute is resolved.
    Triggered when status changes to a 'resolved' type.
    """
    # normalize status name
    if instance.status in ["RESOLVED_REFUND", "RESOLVED_RELEASE"]:
        resolution_text = getattr(instance, "admin_remarks", "Dispute resolved.")

        # notify the buyer
        if instance.buyer:
            notify_dispute_resolved.delay(
                user_id=instance.buyer.id,
                dispute_id=instance.id,
                resolution=resolution_text,
            )

        # notify the seller
        if instance.seller:
            notify_dispute_resolved.delay(
                user_id=instance.seller.id,
                dispute_id=instance.id,
                resolution=resolution_text,
            )


@receiver(post_save, sender=DisputeMessage)
def dispute_reply_handler(sender, instance, created, **kwargs):
    """
    Triggered whenever a new dispute message is created.
    Automatically notifies the opposite party.
    """
    if not created:
        return

    dispute = instance.conversation.dispute
    sender_user = instance.sender

    # Determine who to notify
    if sender_user == dispute.buyer:
        recipient = dispute.seller
    else:
        recipient = dispute.buyer

    if not recipient:
        return

    # Get dispute title or fallback
    dispute_title = (
        dispute.title or f"Order #{dispute.order.id if dispute.order else dispute.id}"
    )

    # Trigger async notification + email
    notify_dispute_reply.delay(
        artist_id=recipient.id,
        dispute_id=dispute.id,
        dispute_title=dispute_title,
    )
