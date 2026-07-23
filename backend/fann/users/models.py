from django.contrib.auth import password_validation
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from fann.market_final.models import (
    Region,
    InstagramFollowers,
    TikTokFollowers,
    YoutubeSubscribers,
    TwitterFollowers,
    PrimaryPlatform,
    PriceRange,
)

from fann import users
from fann.common.model_mixins import TimestampMixin

NULL_AND_BLANK = {"null": True, "blank": True}
CHOICES_IN_ROLE = [
    ("Admin", "Admin"),
    ("Customer", "Customer"),
    ("Artist", "Artist"),
    ("SuperAdmin", "SuperAdmin"),
    ("Organization", "Organization"),
    ("Gallery", "Gallery"),
    ("Collector", "Collector"),
    ("Ambassador", "Ambassador"),
    ("Investor", "Investor"),
    # [local/tryfann] Curator: GAME-track role offered by the TryFann signup
    ("Curator", "Curator"),
]

CHOICES_IN_KYC = [
    ("Passport", "Passport"),
    ("National ID", "National ID"),
    ("Emirates ID", "Emirates ID"),
    ("Iqama (Saudi Residency)", "Iqama (Saudi Residency)"),
    ("Driver's License", "Driver's License"),
]

ORG_TYPE_CHOICES = [
    ("commercial", "commercial"),
    ("non_profit", "non_profit"),
    ("public_museum", "public_museum"),
    ("private_collection", "private_collection"),
    ("other", "other"),
]


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        :param email: email
        :param password: password
        :param age: age
        :param gender
        :param extra_fields: extra fields
        :return: user
        """
        if not email:
            raise ValueError("The given email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password, **extra_fields):
        """
        Creates and saves a user with the given email and password.
        :param email: email
        :param password: password
        :param extra_fields: extra fields
        :return: user
        """
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str, **extra_fields) -> object:
        """
        Creates and saves a superuser with the given email and password.
        :param email: email
        :param password: password
        :param extra_fields: extra fields
        :return: superuser
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    User model for the application with email as the unique identifier instead of username and
    other fields like age.

    """

    use_for_related_fields = True
    username = None
    organization = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="user_organization",
        null=True,
        blank=True,
    )
    is_verify = models.BooleanField(default=True)
    email = models.EmailField(max_length=50, unique=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    about = models.TextField(null=True, blank=True)
    website = models.JSONField(default=list, null=True, blank=True)
    socials = models.JSONField(default=list, null=True, blank=True)
    interests = models.JSONField(default=list, null=True, blank=True)
    organization_name = models.CharField(max_length=120, null=True, blank=True)
    admin_contact_name = models.CharField(max_length=120, null=True, blank=True)
    password = models.CharField(max_length=128, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    role = models.CharField(max_length=100, choices=CHOICES_IN_ROLE, default="Customer")
    banner = models.ImageField(upload_to="banners", null=True, blank=True)
    profile_image = models.ImageField(upload_to="profile_images", null=True, blank=True)
    location = models.CharField(max_length=100, null=True, blank=True)
    timezone = models.CharField(max_length=100, null=True, blank=True)
    language = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=100, null=True, blank=True)
    user_contract = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    # try fann
    region = models.ForeignKey(
        Region,
        on_delete=models.CASCADE,
        related_name="user_region",
        null=True,
        blank=True,
    )
    points = models.CharField(max_length=100, **NULL_AND_BLANK)
    referral_code = models.CharField(max_length=150, **NULL_AND_BLANK)
    profile_step = models.CharField(max_length=50, **NULL_AND_BLANK)
    profile_completed = models.BooleanField(default=False)
    profile_partial_completed = models.BooleanField(default=False)
    # TryFann Point 2: full per-role application answers (schema-driven funnel).
    # Additive JSON store so every role's PDF fields persist without 30 columns.
    application_data = models.JSONField(default=dict, blank=True, null=True)
    try_market = models.BooleanField(default=False)
    title = models.CharField(max_length=100, **NULL_AND_BLANK)
    focus = models.CharField(max_length=100, **NULL_AND_BLANK)
    years_of_experience = models.CharField(max_length=50, **NULL_AND_BLANK)
    instagram_handle = models.CharField(max_length=255, **NULL_AND_BLANK)
    total_referral_clicks = models.PositiveIntegerField(default=0)
    influence_points = models.PositiveIntegerField(default=0)
    fann_2fa = models.BooleanField(default=False)
    fann_2fa_otp = models.CharField(max_length=100, **NULL_AND_BLANK)
    fann_2fa_otp_created = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    # P0-4: how this user first arrived (e.g. "referral:TF-XXXX", a utm_source,
    # or "direct"). Powers acquisition attribution in the admin funnel.
    acquisition_source = models.CharField(max_length=120, **NULL_AND_BLANK)
    # Ambassador
    instagram_follower = models.ForeignKey(
        InstagramFollowers,
        on_delete=models.CASCADE,
        related_name="user_insta_follower",
        null=True,
        blank=True,
    )
    tiktok_handle = models.CharField(max_length=255, **NULL_AND_BLANK)
    tiktok_follower = models.ForeignKey(
        TikTokFollowers,
        on_delete=models.CASCADE,
        related_name="user_tiktok_follower",
        null=True,
        blank=True,
    )
    youtube_handle = models.CharField(max_length=255, **NULL_AND_BLANK)
    youtube_subscribers = models.ForeignKey(
        YoutubeSubscribers,
        on_delete=models.CASCADE,
        related_name="user_youtube_subscriber",
        null=True,
        blank=True,
    )
    twitter_handle = models.CharField(max_length=255, **NULL_AND_BLANK)
    twitter_follower = models.ForeignKey(
        TwitterFollowers,
        on_delete=models.CASCADE,
        related_name="user_twitter_follower",
        null=True,
        blank=True,
    )
    primary_platform = models.ForeignKey(
        PrimaryPlatform,
        on_delete=models.CASCADE,
        related_name="user_primary_platform",
        null=True,
        blank=True,
    )
    content_niche = models.CharField(max_length=255, **NULL_AND_BLANK)
    price_range = models.ForeignKey(
        PriceRange,
        on_delete=models.CASCADE,
        related_name="user_price_range",
        null=True,
        blank=True,
    )
    preferred_commission_rate = models.CharField(max_length=100, **NULL_AND_BLANK)
    shipping_preference = models.CharField(max_length=100, **NULL_AND_BLANK)
    studio_address = models.CharField(max_length=100, **NULL_AND_BLANK)
    education = models.CharField(max_length=100, **NULL_AND_BLANK)
    award_artist = models.CharField(max_length=100, **NULL_AND_BLANK)
    artist_statement = models.TextField(null=True, blank=True)
    organization_type = models.CharField(
        max_length=100, choices=ORG_TYPE_CHOICES, default="commercial"
    )
    organization_email = models.EmailField(null=True, blank=True)
    organization_main_contact_name = models.CharField(max_length=100, **NULL_AND_BLANK)
    founded_year = models.PositiveIntegerField(default=0)
    exhibition_count = models.PositiveIntegerField(default=0)
    promotion_plan = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()
    REQUIRED_FIELDS = []
    USERNAME_FIELD = "email"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class ArtistPortFolio(TimestampMixin):
    title = models.CharField(max_length=100)
    artist = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="artists_portfolio",
        null=True,
        blank=True,
    )
    description = models.TextField(null=True, blank=True)
    external_link = models.CharField(max_length=100, null=True, blank=True)
    image = models.ImageField(upload_to="portfolio_image", null=True, blank=True)


class UserWebsites(TimestampMixin):
    name = models.CharField("Name", max_length=255, null=True, blank=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="websites", blank=True
    )


class SocialMedia(TimestampMixin):
    name = models.CharField("Name", max_length=255, null=True, blank=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="social_media",
        null=True,
        blank=True,
    )


class UserPortfolio(TimestampMixin):
    file = models.FileField(upload_to="portfolio", null=True, blank=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="portfolio", null=True, blank=True
    )


class KYCSubmission(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    user = models.OneToOneField(
        "users.User", on_delete=models.CASCADE, related_name="kyc"
    )
    first_name = models.CharField("First Name", max_length=255, null=True, blank=True)
    last_name = models.CharField("Last Name", max_length=255, null=True, blank=True)
    phone_number = models.CharField(
        "Phone Number", max_length=255, null=True, blank=True
    )
    address = models.TextField(null=True, blank=True)
    id_card = models.CharField("ID Card", max_length=255, null=True, blank=True)
    front_image = models.FileField(upload_to="front_images", null=True, blank=True)
    back_image = models.FileField(upload_to="back_images", null=True, blank=True)
    wallet = models.CharField(max_length=100)
    tx = models.CharField(max_length=100, null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    country_code = models.CharField(max_length=100, null=True, blank=True)
    identity_contract = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")


class UserAccount(TimestampMixin):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="account")
    currency = models.CharField(max_length=3, default="USD")  # reporting currency
    available_balance = models.DecimalField(max_digits=20, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user} account"


class SellerInvitation(TimestampMixin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invitation")
    code = models.CharField("Code", max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)


class UserVerifications(TimestampMixin):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="verifications_code"
    )
    code = models.CharField("Code", max_length=255, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)


class NotificationSetting(TimestampMixin):
    push = models.BooleanField(default=True)
    email = models.BooleanField(default=True)
    sms = models.BooleanField(default=True)
    newsletter = models.BooleanField(default=True)
    price_alerts = models.BooleanField(default=True)
    auction_reminder = models.BooleanField(default=True)
    event_invites = models.BooleanField(default=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notification_settings"
    )


class PreferenceSetting(TimestampMixin):
    currency = models.CharField(max_length=100, null=True, blank=True)
    language = models.CharField(max_length=100, null=True, blank=True)
    show_collection = models.BooleanField(default=True)
    show_purchases = models.BooleanField(default=True)
    show_activity = models.BooleanField(default=True)
    allow_messages = models.BooleanField(default=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="preference_settings",
        null=True,
        blank=True,
    )


class VerificationCode(TimestampMixin):
    code = models.CharField(max_length=30)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_in_code"
    )


class IntersetReward(TimestampMixin):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="user_profile", **NULL_AND_BLANK
    )
    art_style = models.JSONField(default=list, **NULL_AND_BLANK)  # P1-6: preferred styles
    geographic_interset = models.JSONField(default=list, **NULL_AND_BLANK)
    price_interset = models.CharField(max_length=255, **NULL_AND_BLANK)  # P1-6: price band
    preferred_time_periods = models.JSONField(default=list, **NULL_AND_BLANK)
    goal_type = models.JSONField(default=list, **NULL_AND_BLANK)
    points_reward = models.JSONField(default=dict, **NULL_AND_BLANK)
    # P1-6 — Collector preference profiling. Segmentation-queryable dimensions
    # that complete the buyer picture (styles/price already above): preferred
    # mediums, display spaces, and buying cadence. Used to boost queue standing
    # and to segment collectors for concierge outreach.
    mediums = models.JSONField(default=list, **NULL_AND_BLANK)  # e.g. ["painting","sculpture"]
    preferred_spaces = models.JSONField(default=list, **NULL_AND_BLANK)  # e.g. ["home","office"]
    buying_frequency = models.CharField(max_length=40, **NULL_AND_BLANK)  # first_time|occasional|regular|avid


class KYCVerification(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    user = models.OneToOneField(
        "users.User", on_delete=models.CASCADE, related_name="kyc_verification"
    )
    id_number = models.CharField(max_length=255, **NULL_AND_BLANK)
    dob = models.DateField(**NULL_AND_BLANK)
    country = models.CharField(max_length=100, **NULL_AND_BLANK)
    state = models.CharField(max_length=100, **NULL_AND_BLANK)
    street_address = models.CharField(max_length=100, **NULL_AND_BLANK)
    id_type = models.CharField(
        max_length=100, choices=CHOICES_IN_KYC, default="Passport"
    )
    city = models.CharField(max_length=100, **NULL_AND_BLANK)
    postal_code = models.CharField(max_length=100, **NULL_AND_BLANK)
    gov_issued_id = models.FileField(upload_to="kyc_documents", **NULL_AND_BLANK)
    gov_issued_id_front = models.FileField(upload_to="kyc_documents", **NULL_AND_BLANK)
    gov_issued_id_back = models.FileField(upload_to="kyc_documents", **NULL_AND_BLANK)
    proof_address = models.FileField(upload_to="kyc_documents", **NULL_AND_BLANK)
    is_kyc_completed = models.BooleanField(default=False)
    social_link_handler = models.CharField(max_length=100, **NULL_AND_BLANK)
    social_link_followers = models.CharField(max_length=100, **NULL_AND_BLANK)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class UserReferral(models.Model):
    referenced_by = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="referenced_by",
        **NULL_AND_BLANK,
    )
    referenced_to = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="referenced_to",
        **NULL_AND_BLANK,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class OrgSecuritySetting(models.Model):
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="org_security_settings",
        null=True,
        blank=True,
    )
    public_gallery = models.BooleanField(default=False)
    require_artist = models.BooleanField(default=False)
    guest_purchase = models.BooleanField(default=False)
    artist_messaging = models.BooleanField(default=False)
    monthly_analytics = models.BooleanField(default=False)
    financial_setting = models.CharField(max_length=100, **NULL_AND_BLANK)
    payment_terms = models.CharField(max_length=100, **NULL_AND_BLANK)
    payment_currency = models.CharField(max_length=100, **NULL_AND_BLANK)
    gallery_configuration = models.BooleanField(default=False)
    direct_sale = models.BooleanField(default=False)
    allow_account = models.BooleanField(default=False)
    artwork_limit = models.CharField(max_length=100, **NULL_AND_BLANK)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class CommunityChallenge(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_community_challenge",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100, **NULL_AND_BLANK)
    deadline = models.DateField(**NULL_AND_BLANK)
    theme = models.CharField(max_length=100, **NULL_AND_BLANK)
    participant_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(
        CommunityChallenge,
        on_delete=models.CASCADE,
        related_name="participants",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="joined_challenges",
        null=True,
        blank=True,
    )
    joined_at = models.DateTimeField(auto_now_add=True)


CHOICE_IN_STATUS = [
    ("Pending", "Pending"),
    ("In-Progress", "In-Progress"),
    ("Completed", "Completed"),
    ("Rejected", "Rejected"),
]

class UserWithDrawRequests(TimestampMixin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_with_draw")
    payment_method = models.CharField(max_length=100, **NULL_AND_BLANK)
    amount = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=100, default='Pending')


class BankAccount(models.Model):
    country = models.CharField(max_length=2)
    bank_city = models.CharField(max_length=120)
    bank_name = models.CharField(max_length=255)
    nick_name = models.CharField(max_length=120, blank=True, null=True)
    bic_swift = models.CharField(max_length=11)
    account_number = models.CharField(max_length=64)
    user = models.ForeignKey(User, related_name='user_banks', on_delete=models.CASCADE)
    bank_holder_name = models.CharField(max_length=255)
    is_primary = models.BooleanField(default=False)
    street_address = models.CharField(max_length=255)
    zip_code = models.CharField(max_length=20)
    city = models.CharField(max_length=120)
    state_province = models.CharField(max_length=120, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bank_accounts"
        indexes = [
            models.Index(fields=["country"]),
            models.Index(fields=["bic_swift"]),
            models.Index(fields=["account_number"]),
        ]

    def __str__(self):
        return f"{self.nick_name or self.bank_name} ({self.country})"
