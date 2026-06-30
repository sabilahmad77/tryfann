from django.utils import timezone
from django_extensions.db.models import TimeStampedModel

from fann.common.model_mixins import TimestampMixin
from django.db import models

from fann.users.models import User

CHOICE_IN_ART_TYPE = [
    ("Fractional", "Fractional"),
    ("Single", "Single"),
    ("Offers", "Offers"),
]


class Art(TimestampMixin):

    artist = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="artist_art"
    )

    token_address = models.CharField(max_length=100, null=True, blank=True)
    sale_id = models.CharField(max_length=255, null=True, blank=True)
    is_sold = models.BooleanField(default=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    symbol = models.CharField(max_length=50, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    dimensions = models.CharField(max_length=255, null=True, blank=True)
    year = models.IntegerField(null=True, blank=True)
    royalty = models.IntegerField(null=True, blank=True)
    art_tags = models.JSONField(null=True, blank=True)
    image = models.FileField(upload_to="arts/", null=True, blank=True)
    no_of_fraction = models.PositiveIntegerField(default=1)
    remaining_fractions = models.PositiveIntegerField(default=1)
    hash = models.CharField(max_length=100, null=True, blank=True)
    price = models.PositiveIntegerField(default=0)
    discount_price = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=255, null=True, blank=True)
    medium = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=255, null=True, blank=True)
    enable_vr = models.CharField(max_length=255, null=True, blank=True)
    currency = models.CharField(max_length=255, null=True, blank=True)
    edition_size = models.CharField(max_length=255, null=True, blank=True)
    edition_number = models.CharField(max_length=255, null=True, blank=True)
    width = models.CharField(max_length=255, null=True, blank=True)
    height = models.CharField(max_length=255, null=True, blank=True)
    depth = models.CharField(max_length=255, null=True, blank=True)
    units = models.CharField(max_length=255, null=True, blank=True)
    material_used = models.CharField(max_length=255, null=True, blank=True)
    provenance = models.CharField(max_length=255, null=True, blank=True)
    publication_status = models.CharField(max_length=255, null=True, blank=True)
    network = models.CharField(max_length=255, null=True, blank=True)
    art_type = models.CharField(
        max_length=20,
        choices=CHOICE_IN_ART_TYPE,
        default="Single",
        help_text="Is this a fractional piece or a single-edition work?",
    )
    frame = models.CharField(
        max_length=20,
        choices=[("Yes", "Yes"), ("No", "No")],
        default="No",
        null=True,
        blank=True,
        help_text="Does the artwork come with a frame?",
    )

    delivery_days = models.IntegerField(
        default=7, null=True, blank=True, help_text="Estimated delivery time in days"
    )

    shipment_type = models.CharField(
        max_length=50,
        choices=[
            ("Standard", "Standard Shipping"),
            ("Express", "Express Shipping"),
            ("Free Shipping", "Free Shipping"),
        ],
        default="Standard",
        null=True,
        blank=True,
        help_text="Shipping method for the artwork",
    )

    color_palette = models.CharField(
        max_length=50,
        choices=[
            ("Warm", "Warm Tones"),
            ("Cool", "Cool Tones"),
            ("Neutral", "Neutral Tones"),
            ("Earthy", "Earthy Tones"),
            ("Oceanic", "Oceanic Tones"),
        ],
        default="Neutral",
        null=True,
        blank=True,
        help_text="Dominant color palette of the artwork",
    )

    copy_or_original = models.CharField(
        max_length=20,
        choices=[("Original", "Original Artwork"), ("Copy", "Reproduction Copy")],
        default="Original",
        null=True,
        blank=True,
        help_text="Is this an original or a copy?",
    )

    print_or_real = models.CharField(
        max_length=20,
        choices=[("Real", "Physical Artwork"), ("Print", "Digital Print")],
        default="Real",
        null=True,
        blank=True,
        help_text="Physical artwork or print",
    )

    recommended_environment = models.CharField(
        max_length=50,
        choices=[
            ("Living Room", "Living Room"),
            ("Bedroom", "Bedroom"),
            ("Office", "Office"),
            ("Gallery", "Gallery"),
            ("Kid Room", "Kid Room"),
            ("Dining Room", "Dining Room"),
        ],
        default="Living Room",
        null=True,
        blank=True,
        help_text="Best environment to display this artwork",
    )

    mood_atmosphere = models.CharField(
        max_length=50,
        choices=[
            ("Calming", "Calming"),
            ("Energetic", "Energetic"),
            ("Joyful", "Joyful"),
            ("Reflective", "Reflective"),
            ("Relaxing", "Relaxing"),
            ("Neutral", "Neutral"),
        ],
        default="Neutral",
        null=True,
        blank=True,
        help_text="Emotional mood conveyed by the artwork",
    )

    lighting_requirements = models.CharField(
        max_length=50,
        choices=[
            ("Natural Light", "Natural Light"),
            ("Bright Light", "Bright Light"),
            ("Soft Light", "Soft Light"),
        ],
        default="Natural Light",
        null=True,
        blank=True,
        help_text="Recommended lighting for optimal display",
    )

    reproduction_type = models.CharField(
        max_length=50,
        choices=[
            ("Lithograph", "Lithograph"),
            ("Screen Print", "Screen Print"),
            ("Giclee", "Giclée Print"),
            ("No Value", "No Reproduction"),
        ],
        default="No Value",
        null=True,
        blank=True,
        help_text="Type of reproduction technique used (if applicable)",
    )

    target_audience = models.CharField(
        max_length=50,
        choices=[
            ("Collectors", "Art Collectors"),
            ("Corporate", "Corporate Clients"),
            ("Young Professionals", "Young Professionals"),
            ("Interior Designers", "Interior Designers"),
            ("General Public", "General Public"),
        ],
        default="Collectors",
        null=True,
        blank=True,
        help_text="Primary target audience for this artwork",
    )

    def __str__(self):
        return f"{self.title} ({self.get_art_type_display()})"


class BuyerOffers(TimestampMixin):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="offers")
    buyer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="offers_buyer"
    )
    amount = models.PositiveIntegerField(default=0)
    reason = models.CharField(max_length=255, null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)


class ArtShare(TimeStampedModel):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="art_share")
    shared_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="share_share"
    )
    platform = models.CharField(max_length=100)


class ArtistFollow(TimestampMixin):
    artist = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="artist_follower"
    )
    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="artist_followed"
    )


class ArtGallery(TimestampMixin):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="gallery")
    image = models.FileField(upload_to="arts/", null=True, blank=True)

    def __str__(self):
        return f"{self.art.id} --- {self.art.title}"


class ArtWishList(TimestampMixin):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="wishlist")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_wishlist"
    )


class ArtViewCount(TimestampMixin):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="views")
    count = models.PositiveIntegerField(default=0)


class ArtReviews(TimestampMixin):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="reviews")
    order = models.ForeignKey(
        "Order",
        on_delete=models.CASCADE,
        related_name="art_reviews",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_reviews"
    )
    rating = models.PositiveIntegerField(default=0)
    comment = models.TextField(null=True, blank=True)


class ArtOwner(TimestampMixin):
    art = models.ForeignKey(Art, on_delete=models.CASCADE, related_name="art_owner")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owner_art")
    factions = models.PositiveIntegerField(default=1)


class ArtComment(TimestampMixin):
    art = models.ForeignKey(
        Art,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    comment = models.TextField()
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_comments",
        null=True,
        blank=True,
    )


class BidStatus:
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"
    WON = "won"
    LOST = "lost"

    CHOICES = [
        (ACTIVE, "Active"),
        (WITHDRAWN, "Withdrawn"),
        (WON, "Won"),
        (LOST, "Lost"),
    ]


CHOICE_IN_AUCTION_STATUS = [
    ("Upcoming", "Upcoming"),
    ("Live", "Live"),
    ("Ended", "Ended"),
    ("Finalized", "Finalized"),
]


class Auction(TimestampMixin):
    art = models.OneToOneField(
        Art,
        on_delete=models.CASCADE,
        related_name="auction",
        help_text="Art piece being auctioned (must be purchase_type='auction')",
    )
    artist = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="artist_auction"
    )
    start_time = models.DateTimeField(help_text="When bidding opens")
    end_time = models.DateTimeField(help_text="When bidding closes")
    starting_bid = models.FloatField(null=True, blank=True)
    min_bid_increment = models.FloatField(default=0)
    buy_now_price = models.FloatField(default=0)
    reserve_price = models.FloatField(null=True, blank=True)
    auction_id = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=CHOICE_IN_AUCTION_STATUS,
        default="Upcoming",
        help_text="Current state of the auction",
    )
    winner = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="won_auctions",
        help_text="User who won the auction (set when auction ends)",
    )
    final_price = models.FloatField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = ["-start_time"]
        indexes = [
            models.Index(fields=["status", "end_time"]),
        ]

    def __str__(self):
        return f"Auction of “{self.art.title}” ({self.get_status_display()})"


class AuctionBid(TimestampMixin):
    auction = models.ForeignKey(
        Auction, on_delete=models.CASCADE, related_name="auction_bids"
    )
    bidder = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bids",
        help_text="User who placed the bid",
    )
    amount = models.FloatField(default=1)
    status = models.CharField(
        max_length=10,
        choices=BidStatus.CHOICES,
        default=BidStatus.ACTIVE,
        help_text="Current state of this bid",
    )

    class Meta:
        ordering = ["-amount", "created_at"]
        indexes = []

    # def __str__(self):
    #     return f"Bid {self.amount} on “{self.art.title}” by {self.bidder.username}"


CHOICE_PAYMENT_STATUS = [
    ("Authorized", "Authorized"),
    ("Captured", "Captured"),
    ("Refunded", "Refunded"),
    ("Failed", "Failed"),
]
CHOICE_IN_ORDER_STATUS = [
    ("Pending", "Pending"),
    ("In Transit", "In Transit"),
    ("Shipped", "Shipped"),
    ("Delivered", "Delivered"),
    ("Disputed", "Disputed"),
    ("Completed", "Completed"),
    ("Canceled", "Canceled"),
]

CHOICE_IN_CURRENCY = [
    ("Fiat", "Fiat"),
    ("Crypto", "Crypto"),
]


class Order(models.Model):
    order_id = models.CharField(max_length=255, null=True, blank=True)
    sale_id = models.CharField(max_length=255, null=True, blank=True)
    buyer = models.ForeignKey(User, on_delete=models.PROTECT, related_name="orders")
    art = models.ForeignKey(
        Art, on_delete=models.PROTECT, related_name="orders", null=True, blank=True
    )
    auction = models.ForeignKey(
        Auction, on_delete=models.PROTECT, related_name="orders", null=True, blank=True
    )
    artist = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="artist_orders"
    )
    status = models.CharField(
        max_length=20, choices=CHOICE_IN_ORDER_STATUS, default="Pending"
    )
    eta = models.DateTimeField(null=True, blank=True)
    tracking_id = models.CharField(max_length=255, null=True, blank=True)
    currency = models.CharField(
        max_length=10, choices=CHOICE_IN_CURRENCY, default="Fiat"
    )
    offer = models.ForeignKey(
        BuyerOffers,
        on_delete=models.CASCADE,
        related_name="offers_order",
        null=True,
        blank=True,
    )
    shipped_at = models.DateTimeField(null=True, blank=True)
    in_transit = models.BooleanField(default=False)
    no_of_fractions = models.IntegerField(default=1)
    # money columns (store what you need to report fast)
    subtotal = models.DecimalField(
        max_digits=20, decimal_places=2, default=0
    )  # sum(line_qty*unit_price)
    shipping_cost = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    platform_fee = models.DecimalField(
        max_digits=20, decimal_places=2, default=0
    )  # marketplace cut
    discount_total = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    total = models.DecimalField(
        max_digits=20, decimal_places=2, default=0
    )  # subtotal+shipping+tax-fee-discount

    payment_status = models.CharField(
        max_length=12, choices=CHOICE_PAYMENT_STATUS, default="Authorized"
    )
    locations = models.CharField(max_length=1000, null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["artist", "status"]),
            models.Index(fields=["artist", "created_at"]),
            models.Index(fields=["payment_status", "paid_at"]),
        ]

    def generate_order_id(self):
        """Generate order_id like YYYY-001, YYYY-002..."""
        current_year = timezone.now().year
        last_order = (
            Order.objects.filter(order_id__startswith=str(current_year))
            .order_by("-order_id")
            .first()
        )

        if last_order and last_order.order_id:
            last_number = int(last_order.order_id.split("-")[1])
            new_number = last_number + 1
        else:
            new_number = 1

        return f"{current_year}-{new_number:03d}"

    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = self.generate_order_id()
        super().save(*args, **kwargs)


class OrderLabel(TimestampMixin):
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="labels")
    label = models.CharField(max_length=255)


CHOICE_IN_PAYMENT_GATEWAY = [
    ("Fiat", "Fiat"),
    ("Crypto", "Crypto"),
]
STATUS_IN_DISPUTE = [
    ("FILED", "FILED"),
    ("RESOLVED_REFUND", "RESOLVED_REFUND"),
    ("RESOLVED_RELEASE", "RESOLVED_RELEASE"),
]


class OrderDispute(TimestampMixin):
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="disputes", null=True, blank=True
    )
    buyer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="dispute_customer",
        null=True,
        blank=True,
    )
    seller = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="dispute_seller",
        null=True,
        blank=True,
    )
    admin_remarks = models.TextField(null=True, blank=True)
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=200, choices=STATUS_IN_DISPUTE, default="FILED"
    )


class DisputeDocuments(TimestampMixin):
    dispute = models.ForeignKey(
        OrderDispute, on_delete=models.PROTECT, related_name="documents"
    )
    file = models.FileField(upload_to="disputes/", null=True, blank=True)


class DisputeConversation(TimestampMixin):
    dispute = models.ForeignKey(
        OrderDispute,
        on_delete=models.PROTECT,
        related_name="conversations",
        null=True,
        blank=True,
    )

    # exactly one non-admin participant
    party = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="dispute_conversations_as_party",
    )
    party_role = models.CharField(max_length=10, default="Buyer")

    # optional assigned admin
    admin = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="dispute_conversations_as_admin",
        null=True,
        blank=True,
    )

    is_open = models.BooleanField(default=True)
    last_message_at = models.DateTimeField(null=True, blank=True)


class DisputeMessage(TimestampMixin):
    conversation = models.ForeignKey(
        DisputeConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="dispute_messages",
    )
    message = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)


class PaymentTransaction(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    transactions_type = models.CharField(max_length=100, default='Purchase')
    gateway = models.CharField(max_length=12, choices=CHOICE_IN_PAYMENT_GATEWAY)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    fee = models.DecimalField(max_digits=20, decimal_places=2, default=0)  # gateway fee
    currency = models.CharField(
        max_length=10, choices=CHOICE_IN_CURRENCY, default="Fiat"
    )
    external_id = models.CharField(max_length=128, blank=True)  # charge id / tx hash
    status = models.CharField(
        max_length=12, choices=CHOICE_PAYMENT_STATUS, default="Authorized"
    )
    processed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["status", "processed_at"])]


CHOICE_IN_PAYOUTS = [
    ("Pending", "Pending"),
    ("Processing", "Processing"),
    ("Paid", "Paid"),
    ("Failed", "Failed"),
]


class Payout(models.Model):
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payouts")
    art = models.ForeignKey(
        Art, on_delete=models.CASCADE, related_name="art_payouts", null=True, blank=True
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="order_payouts",
        null=True,
        blank=True,
    )
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    release_platform = models.CharField(max_length=50, default="Crypto wallet")
    currency = models.CharField(
        max_length=10, choices=CHOICE_IN_CURRENCY, default="Fiat"
    )
    scheduled_for = models.DateTimeField()  # drives “Next payout in 3 days”
    status = models.CharField(
        max_length=12, choices=CHOICE_IN_PAYOUTS, default="Pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["artist", "status", "scheduled_for"])]


class ArtistShop(TimestampMixin):
    artist = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="artist_shop"
    )
    arts = models.ManyToManyField(Art, related_name="shop_arts")
    profile_image = models.ImageField(upload_to="shop_images/", null=True, blank=True)
    name = models.CharField(max_length=128)
    description = models.TextField(null=True, blank=True)


class OrganizationChallenge(TimestampMixin):
    organization = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="organization_challenges"
    )
    title = models.CharField(max_length=128)
    category = models.CharField(max_length=128)
    description = models.TextField(null=True, blank=True)
    rule = models.CharField(max_length=128, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    max_participants = models.IntegerField(default=0)
    reward_amount = models.FloatField(default=0)
    reward_currency = models.CharField(max_length=10, default="Fiat")
    submission_rule = models.CharField(max_length=128, null=True, blank=True)
    challenge_image = models.FileField(
        upload_to="challenge_images/", null=True, blank=True
    )
    no_of_winners = models.IntegerField(default=0)


class ChallengeAttachments(TimestampMixin):
    challenge = models.ForeignKey(
        OrganizationChallenge,
        on_delete=models.CASCADE,
        related_name="challenge_attachments",
    )
    image = models.FileField(upload_to="challenge_attachments/", null=True, blank=True)


STATUS_IN_EVENTS = [("Upcoming", "Upcoming"), ("Live", "Live"), ("Ended", "Ended")]


class Event(TimestampMixin):
    title = models.CharField(max_length=128)
    description = models.TextField(null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    max_participants = models.IntegerField(default=0)
    arts = models.ManyToManyField(Art, related_name="event_arts")
    location = models.CharField(max_length=128, null=True, blank=True)
    image = models.FileField(upload_to="event_images/", null=True, blank=True)
    status = models.CharField(
        max_length=128, choices=STATUS_IN_EVENTS, default="Upcoming"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="event_user", null=True, blank=True
    )


class BuyerRSVP(TimestampMixin):
    event = models.ForeignKey(
        Event, on_delete=models.CASCADE, related_name="rsvp_events"
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rsvp_users")


class OrganizationChallengeParticipant(models.Model):
    challenge = models.ForeignKey(
        OrganizationChallenge,
        on_delete=models.CASCADE,
        related_name="challenge_participants",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="joined_org_challenges",
        null=True,
        blank=True,
    )
    joined_at = models.DateTimeField(auto_now_add=True)


class UserDiscussion(TimestampMixin):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_discussion",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=128, null=True, blank=True)
    category = models.CharField(max_length=128, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class DiscussionReply(TimestampMixin):
    discussion = models.ForeignKey(
        UserDiscussion,
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_replies",
        null=True,
        blank=True,
    )
    message = models.TextField()


class DiscussionView(models.Model):
    discussion = models.ForeignKey(
        UserDiscussion,
        on_delete=models.CASCADE,
        related_name="discussion_views",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_discussion_views",
        null=True,
        blank=True,
    )
    viewed_at = models.DateTimeField(auto_now_add=True)


class UserBoard(TimestampMixin):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_board", null=True, blank=True
    )
    title = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class UserBoardCollection(TimestampMixin):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_board_collection",
        null=True,
        blank=True,
    )
    board_collection = models.ForeignKey(
        UserBoard,
        on_delete=models.CASCADE,
        related_name="board_fav_collection",
        null=True,
        blank=True,
    )
    art = models.ForeignKey(
        Art, on_delete=models.CASCADE, related_name="art_board", null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class BuyerCounterOffers(TimeStampedModel):
    art = models.ForeignKey(
        Art,
        on_delete=models.CASCADE,
        related_name="art_buy_offer_counter",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="user_buy_offer_counter",
        null=True,
        blank=True,
    )
    amount = models.PositiveIntegerField(null=True, blank=True)
    expired_date = models.DateField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
