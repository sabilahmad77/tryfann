from django.db import models

from fann import users
from fann.common.model_mixins import TimestampMixin

# Create your models here.

CHOICES_IN_ART_CATEGORY = [
    ("Contemporary", "Contemporary"),
    ("Digital", "Digital"),
    ("Traditional", "Traditional"),
    ("Photography", "Photography"),
    ("Sculpture", "Sculpture"),
]

CHOICES_IN_ART_ROLE = [
    ("Gallery", "Gallery"),
    ("Artist", "Artist"),
    ("Collector", "Collector"),
]

CHOICES_IN_FEEDBACK = [
    ("Performance Experience", "Performance Experience"),
    ("Features & Functionality", "Features & Functionality"),
    ("Design & Interface", "Design & Interface"),
    ("Performance & Speed", "Performance & Speed"),
    ("Customer Support", "Customer Support"),
    ("Other", "Other"),
]

CHOICES_IN_CATEGORY = [
    ("New Feature", "New Feature"),
    ("Improvement", "Improvement"),
    ("Integration", "Integration"),
    ("User Experience", "User Experience"),
    ("Community Features", "Community Features"),
    ("Other", "Other"),
]
CHOICES_IN_BUG_REPORT_CATEGORY = [
    ("UI/UX Issue", "UI/UX Issue"),
    ("Performance", "Performance"),
    ("Functionality", "Functionality"),
    ("Security", "Security"),
    ("Data Issue", "Data Issue"),
    ("Other", "Other"),
]


class Region(TimestampMixin):
    name = models.CharField(max_length=255, null=True, blank=True)


class ReferralClick(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="referral_clicks",
        null=True,
        blank=True,
    )
    ip_address = models.CharField(max_length=200, null=True, blank=True)
    user_agent = models.CharField(max_length=300, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "ip_address", "user_agent")


class WatchEarn(models.Model):
    title = models.CharField(max_length=100, null=True, blank=True)
    link = models.CharField(max_length=255, null=True, blank=True)
    points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class UserWatchEarn(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="watch_earn_progress",
        null=True,
        blank=True,
    )
    watch = models.ForeignKey(
        WatchEarn,
        on_delete=models.CASCADE,
        related_name="user_watch",
        null=True,
        blank=True,
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Redemption(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_redeems",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=100, null=True, blank=True)
    code = models.CharField(max_length=255, null=True, blank=True)
    points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class UserRedemption(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="redemption_progress",
        null=True,
        blank=True,
    )
    redeem = models.ForeignKey(
        Redemption,
        on_delete=models.CASCADE,
        related_name="user_redemption",
        null=True,
        blank=True,
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class UserSettings(models.Model):
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_fann_settings",
        null=True,
        blank=True,
    )
    email_notification = models.BooleanField(default=False)
    push_notification = models.BooleanField(default=False)
    referral_update = models.BooleanField(default=False)
    reward_milestone = models.BooleanField(default=False)
    artwork_alert = models.BooleanField(default=False)
    msg_comment = models.BooleanField(default=False)
    profile_visibility = models.BooleanField(default=True)
    show_email = models.BooleanField(default=False)
    show_phone = models.BooleanField(default=False)
    show_location = models.BooleanField(default=False)
    language = models.CharField(max_length=100, null=True, blank=True)
    theme = models.CharField(max_length=100, null=True, blank=True)
    profile_timezone = models.CharField(max_length=100, null=True, blank=True)
    preferred_currency = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Progression(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_progression",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200, null=True, blank=True)
    points = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class InstagramFollowers(TimestampMixin):
    range = models.CharField(max_length=255, null=True, blank=True)


class TikTokFollowers(TimestampMixin):
    range = models.CharField(max_length=255, null=True, blank=True)


class YoutubeSubscribers(TimestampMixin):
    range = models.CharField(max_length=255, null=True, blank=True)


class TwitterFollowers(TimestampMixin):
    range = models.CharField(max_length=255, null=True, blank=True)


class PrimaryPlatform(TimestampMixin):
    name = models.CharField(max_length=255, null=True, blank=True)


class UserFollower(models.Model):
    follow_by = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_follow_by",
        null=True,
        blank=True,
    )
    follow_to = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_follow_to",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)


class ArtistRoaster(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_by_artist_roaster",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    specialty = models.CharField(max_length=200, null=True, blank=True)
    status = models.CharField(max_length=200, null=True, blank=True)
    artwork_count = models.PositiveIntegerField(default=0)
    exhibition_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class ArtworkCollection(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_by_artwork_collection",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200, null=True, blank=True)
    artist_name = models.CharField(max_length=200, null=True, blank=True)
    year = models.CharField(max_length=200, null=True, blank=True)
    description = models.CharField(max_length=200, null=True, blank=True)
    dimensions = models.CharField(max_length=200, null=True, blank=True)
    image = models.FileField(upload_to='collection_image', null=True, blank=True)
    medium = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(
        max_length=100, choices=CHOICES_IN_ART_CATEGORY, default="Contemporary"
    )
    acquisition_date = models.DateField(null=True, blank=True)
    purchase_value = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class ArtworkCollectionPoints(TimestampMixin):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_by_artwork_collection_points",
    )
    collection = models.ForeignKey(ArtworkCollection, on_delete=models.CASCADE, related_name="points")


class PuzzleCompletion(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_puzzle_complete",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)


class PriceRange(TimestampMixin):
    name = models.CharField(max_length=255, null=True, blank=True)


class ArtworkArtistCollection(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_in_artwork_artist",
        null=True,
        blank=True,
    )
    image = models.ImageField(upload_to="artwork_artist_images", null=True, blank=True)
    title = models.CharField(max_length=200, null=True, blank=True)
    price = models.CharField(max_length=200, null=True, blank=True)
    dimensions = models.CharField(max_length=200, null=True, blank=True)
    medium = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    no_artist = models.PositiveIntegerField(default=0)
    user_type = models.CharField(
        max_length=100, choices=CHOICES_IN_ART_ROLE, default="Artist"
    )
    created_at = models.DateTimeField(auto_now_add=True)


class UserFeedBack(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_in_feedback",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200, null=True, blank=True)
    describe_idea = models.TextField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    feedback_category = models.CharField(
        max_length=100, choices=CHOICES_IN_CATEGORY, default="New Feature"
    )
    feedback_about = models.CharField(
        max_length=100, choices=CHOICES_IN_FEEDBACK, default="Performance Experience"
    )
    sentiment = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class UserReportBug(models.Model):
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="user_in_report_bug",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200, null=True, blank=True)
    severity = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    device_info = models.CharField(max_length=200, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    bug_category = models.CharField(
        max_length=100, choices=CHOICES_IN_BUG_REPORT_CATEGORY, default="UI/UX Issue"
    )
    bug_image = models.FileField(upload_to="Report_Bug", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
