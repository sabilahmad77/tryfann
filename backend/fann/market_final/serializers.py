from django.db import transaction
# [local/tryfann] removed dead import `from matplotlib.pyplot import title`
# (unused; pulled matplotlib+numpy into the load path for no reason)
from rest_framework import serializers
from django.contrib.auth import authenticate
from fann.users.models import (
    User,
    UserVerifications,
    IntersetReward,
    KYCVerification,
    UserReferral,
)
from .models import (
    Region,
    WatchEarn,
    UserWatchEarn,
    Redemption,
    UserRedemption,
    UserSettings,
    Progression,
    InstagramFollowers,
    TikTokFollowers,
    YoutubeSubscribers,
    TwitterFollowers,
    PrimaryPlatform,
    ArtistRoaster,
    ArtworkCollection,
    UserFollower,
    ArtworkArtistCollection,
    PriceRange,
    UserFeedBack,
    UserReportBug, ArtworkCollectionPoints,
)
from fann.users.utils import generate_random_string, send_email
from django.utils.translation import gettext_lazy as _
import re
from .utils import get_user_leaderboard_rank


CHOICES_IN_ROLE = (
    ("Artist", "Artist"),
    ("Gallery", "Gallery"),
    ("Collector", "Collector"),
    ("Ambassador", "Ambassador"),
    ("Investor", "Investor"),
    # [local/tryfann] Curator: GAME-track role offered by the TryFann signup
    ("Curator", "Curator"),
)

ORG_TYPE_CHOICES = (
    ("commercial", "commercial"),
    ("non_profit", "non_profit"),
    ("public_museum", "public_museum"),
    ("private_collection", "private_collection"),
    ("other", "other"),
)
CHOICES_IN_KYC = (
    ("Passport", "Passport"),
    ("National ID", "National ID"),
    ("Emirates ID", "Emirates ID"),
    ("Iqama (Saudi Residency)", "Iqama (Saudi Residency)"),
    ("Driver's License", "Driver's License"),
)

CHOICES_IN_ARTWORK_CATEGORY = (
    ("Contemporary", "Contemporary"),
    ("Digital", "Digital"),
    ("Traditional", "Traditional"),
    ("Photography", "Photography"),
    ("Sculpture", "Sculpture"),
)
CHOICES_IN_ART_ROLE = (
    ("Gallery", "Gallery"),
    ("Artist", "Artist"),
    ("Collector", "Collector"),
)
CHOICES_IN_FEEDBACK = (
    ("Performance Experience", "Performance Experience"),
    ("Features & Functionality", "Features & Functionality"),
    ("Design & Interface", "Design & Interface"),
    ("Performance & Speed", "Performance & Speed"),
    ("Customer Support", "Customer Support"),
    ("Other", "Other"),
)

CHOICES_IN_CATEGORY = (
    ("New Feature", "New Feature"),
    ("Improvement", "Improvement"),
    ("Integration", "Integration"),
    ("User Experience", "User Experience"),
    ("Community Features", "Community Features"),
    ("Other", "Other"),
)
CHOICES_IN_BUG_REPORT_CATEGORY = (
    ("UI/UX Issue", "UI/UX Issue"),
    ("Performance", "Performance"),
    ("Functionality", "Functionality"),
    ("Security", "Security"),
    ("Data Issue", "Data Issue"),
    ("Other", "Other"),
)
# [local/tryfann] Curator added: GAME-track role offered by the TryFann signup
ALLOWED_ROLES = ["Artist", "Gallery", "Collector", "Curator", "Ambassador", "Investor"]


class UserRegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        style={"input_type": "password"}, write_only=True, required=True
    )
    confirm_password = serializers.CharField(
        style={"input_type": "password"}, write_only=True, required=True
    )
    role = serializers.ChoiceField(
        choices=CHOICES_IN_ROLE,
        required=True,
        error_messages={
            "invalid_choice": "Invalid role selected. Role must be one of: Artist, Gallery, Collector, Curator, Ambassador, Investor"
        },
    )
    region = serializers.SlugRelatedField(
        queryset=Region.objects.all(), required=False, slug_field="id"
    )
    points = serializers.CharField(required=True)
    referral_code = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        # [local/tryfann] block disposable/temporary email providers
        from fann.qualification.antifraud import is_disposable_email

        if is_disposable_email(value):
            raise serializers.ValidationError(
                "Please use a permanent email address."
            )
        return value

    def validate(self, attrs):
        referral_code = attrs.get("referral_code")
        if attrs.get("password") != attrs.get("confirm_password"):
            raise serializers.ValidationError({"password": "Passwords do not match."})

        if (
            referral_code
            and not User.objects.filter(referral_code=referral_code).exists()
        ):
            raise serializers.ValidationError(
                {"referral_code": "referral_code dos not exists."}
            )
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            first_name = validated_data["first_name"]
            last_name = validated_data["last_name"]
            email = validated_data["email"]
            password = validated_data["password"]
            role = validated_data["role"]
            region = validated_data.get("region")
            referral_code = validated_data.get("referral_code", "")
            points = validated_data.get("points", "")

            user = User.objects.create(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                points=points,
                region=region,
                is_verify=False,
                profile_step=1,
                try_market=True,
            )
            user.set_password(password)
            user.save()

            code = generate_random_string()
            UserVerifications.objects.create(user=user, code=code, email=user.email)
            from django.conf import settings as dj_settings
            frontend_base = getattr(dj_settings, "FRONTEND_BASE_URL", "https://tryfann.com").rstrip("/")
            context = {
                "platform_name": "Fann Tech Art",
                "verification_url": f"{frontend_base}/verify-email?email={email}&token={code}",
                "support_email": f"fantech@info.com",
            }
            # Email delivery must never block account creation: if SMTP is
            # unavailable/misconfigured, the signup still succeeds and the user
            # can be re-sent / verify via the link.
            try:
                send_email(
                    context=context,
                    template_path="user_verification.html",
                    user_email=email,
                    subject="User Verification",
                )
            except Exception as exc:  # noqa: BLE001
                import logging
                logging.getLogger(__name__).warning("verification email send failed: %s", exc)
            if referral_code:
                referenced_by = User.objects.get(referral_code=referral_code)
                # §3.5 verified-referrals-only: do NOT credit anyone here. Just
                # record the link. The qualification engine credits the referrer's
                # Readiness Score ONLY after this referee verifies email + completes
                # their profile (services.credit_referral, via the user post_save
                # signal). This kills signup-time referral farming.
                UserReferral.objects.create(
                    referenced_by=referenced_by, referenced_to=user
                )

            return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True)

    def validate(self, data):
        user = authenticate(email=data.get("email"), password=data.get("password"))

        if not user:
            raise serializers.ValidationError({"error": _("Invalid email or password")})

        if not user.is_active:
            raise serializers.ValidationError(
                {"error": _("Your account is inactive. Please contact support.")}
            )

        if not user.is_verify:
            raise serializers.ValidationError({"error": _("Account not verified.")})

        if user.role not in ALLOWED_ROLES:
            raise serializers.ValidationError(
                {
                    "error": _(
                        "Access denied. This account is only allowed to use Try Market users."
                    )
                }
            )

        data["user"] = user
        return data


class UserFinalMarketSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = "__all__"

    def get_profile_image(self, obj):
        request = self.context.get("request")
        if request and obj.profile_image:
            return request.build_absolute_uri(obj.profile_image.url)
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("password", None)
        return data


class UserProfileSetupSerializer(serializers.Serializer):
    title = serializers.CharField(required=True)
    bio = serializers.CharField(required=True)
    website = serializers.CharField(required=False)
    profile_image = serializers.FileField(required=False, allow_null=True)
    focus = serializers.CharField(required=False, allow_blank=True)
    years_of_experience = serializers.CharField(required=False, allow_blank=True)
    instagram_handle = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    # ambassdor
    instagram_follower = serializers.SlugRelatedField(
        queryset=InstagramFollowers.objects.all(), required=False, slug_field="id"
    )
    tiktok_handle = serializers.CharField(required=False, allow_blank=True)
    tiktok_follower = serializers.SlugRelatedField(
        queryset=TikTokFollowers.objects.all(), required=False, slug_field="id"
    )
    youtube_handle = serializers.CharField(required=False, allow_blank=True)
    youtube_subscribers = serializers.SlugRelatedField(
        queryset=YoutubeSubscribers.objects.all(), required=False, slug_field="id"
    )
    twitter_handle = serializers.CharField(required=False, allow_blank=True)
    twitter_follower = serializers.SlugRelatedField(
        queryset=TwitterFollowers.objects.all(), required=False, slug_field="id"
    )
    primary_platform = serializers.SlugRelatedField(
        queryset=PrimaryPlatform.objects.all(), required=False, slug_field="id"
    )
    content_niche = serializers.CharField(required=False, allow_blank=True)

    price_range = serializers.SlugRelatedField(
        queryset=PriceRange.objects.all(), required=False, slug_field="id"
    )
    preferred_commission_rate = serializers.CharField(required=False, allow_blank=True)
    shipping_preference = serializers.CharField(required=False, allow_blank=True)
    studio_address = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(required=False, allow_blank=True)
    award_artist = serializers.CharField(required=False, allow_blank=True)
    artist_statement = serializers.CharField(required=False, allow_blank=True)
    organization_email = serializers.EmailField(required=False, allow_blank=True)
    organization_main_contact_name = serializers.CharField(
        required=False, allow_blank=True
    )
    organization_name = serializers.CharField(required=False, allow_blank=True)

    organization_type = serializers.ChoiceField(
        choices=ORG_TYPE_CHOICES,
        required=False,
        error_messages={
            "invalid_choice": "Invalid organization_type selected. organization_type must be one of: commercial, non_profit, public_museum, private_collection, other"
        },
    )
    founded_year = serializers.IntegerField(required=False)
    exhibition_count = serializers.IntegerField(required=False)
    promotion_plan = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        user = self.context.get("request_user")
        print(user.role)
        if user.role == "Ambassador":
            instagram_valid = attrs.get("instagram_handle") and attrs.get(
                "instagram_follower"
            )
            tiktok_valid = attrs.get("tiktok_handle") and attrs.get("tiktok_follower")
            youtube_valid = attrs.get("youtube_handle") and attrs.get(
                "youtube_subscribers"
            )
            twitter_valid = attrs.get("twitter_handle") and attrs.get(
                "twitter_follower"
            )

            if not (instagram_valid or tiktok_valid or youtube_valid or twitter_valid):
                raise serializers.ValidationError(
                    "Ambassadors must provide at least one platform with its follower/subscriber information."
                )

        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            user = self.context.get("request_user")

            partially_completed = False
            fully_completed = False

            simple_fields = [
                "title",
                "bio",
                "website",
                "focus",
                "years_of_experience",
                "instagram_handle",
                "profile_image",
            ]

            ambassador_fields = [
                "title",
                "bio",
                "profile_image",
                "instagram_handle",
                "instagram_follower",
                "tiktok_handle",
                "tiktok_follower",
                "youtube_handle",
                "youtube_subscribers",
                "twitter_handle",
                "twitter_follower",
                "primary_platform",
                "content_niche",
            ]

            if user.role in ["Artist", "Gallery", "Collector", "Investor"]:
                field_values = {
                    f: validated_data.get(f, getattr(user, f)) for f in simple_fields
                }
                if all(field_values.values()):
                    fully_completed = True
                    partially_completed = True
                elif any(field_values.values()):
                    partially_completed = True
            else:
                field_values = {
                    f: validated_data.get(f, getattr(user, f))
                    for f in ambassador_fields
                }

                platforms_filled = any(
                    [
                        field_values.get("instagram_handle")
                        and field_values.get("instagram_follower"),
                        field_values.get("tiktok_handle")
                        and field_values.get("tiktok_follower"),
                        field_values.get("youtube_handle")
                        and field_values.get("youtube_subscribers"),
                        field_values.get("twitter_handle")
                        and field_values.get("twitter_follower"),
                    ]
                )
                print(platforms_filled)
                if (
                    field_values.get("title")
                    and field_values.get("bio")
                    and field_values.get("profile_image")
                    and field_values.get("content_niche")
                    and field_values.get("primary_platform")
                    and platforms_filled
                ):
                    print("inside")
                    fully_completed = True
                    partially_completed = True
                elif any(
                    [
                        field_values.get("title"),
                        field_values.get("bio"),
                        field_values.get("profile_image"),
                        field_values.get("instagram_handle"),
                        field_values.get("tiktok_handle"),
                        field_values.get("youtube_handle"),
                        field_values.get("twitter_handle"),
                        field_values.get("content_niche"),
                        field_values.get("primary_platform"),
                    ]
                ):
                    partially_completed = True

            for field, value in field_values.items():
                setattr(user, field, value)

            current_points = int(user.points or 0)
            if partially_completed and not user.profile_partial_completed:
                current_points += 50
                user.profile_partial_completed = True
            if fully_completed and not user.profile_completed:
                current_points += 50
                user.profile_completed = True

            if validated_data.get("location"):
                user.location = validated_data.get("location")

            if validated_data.get("phone_number"):
                user.phone_number = validated_data.get("phone_number")

            if validated_data.get("price_range"):
                user.price_range = validated_data.get("price_range")

            if validated_data.get("preferred_commission_rate"):
                user.preferred_commission_rate = validated_data.get(
                    "preferred_commission_rate"
                )

            if validated_data.get("shipping_preference"):
                user.shipping_preference = validated_data.get("shipping_preference")

            if validated_data.get("studio_address"):
                user.studio_address = validated_data.get("studio_address")

            if validated_data.get("education"):
                user.education = validated_data.get("education")

            if validated_data.get("award_artist"):
                user.award_artist = validated_data.get("award_artist")

            if validated_data.get("artist_statement"):
                user.artist_statement = validated_data.get("artist_statement")

            if validated_data.get("organization_email"):
                user.organization_email = validated_data.get("organization_email")

            if validated_data.get("organization_main_contact_name"):
                user.organization_main_contact_name = validated_data.get(
                    "organization_main_contact_name"
                )

            if validated_data.get("organization_name"):
                user.organization_name = validated_data.get("organization_name")

            if validated_data.get("organization_type"):
                user.organization_type = validated_data.get("organization_type")

            if validated_data.get("founded_year"):
                user.founded_year = validated_data.get("founded_year")

            if validated_data.get("exhibition_count"):
                user.exhibition_count = validated_data.get("exhibition_count")

            if validated_data.get("promotion_plan"):
                user.promotion_plan = validated_data.get("promotion_plan")

            user.points = str(current_points)
            user.profile_step = 2
            user.save()

            return {
                "message": "Profile updated successfully",
                "user": UserFinalMarketSerializer(
                    user, context={"request": self.context.get("request")}
                ).data,
            }

    # def create(self, validated_data):
    #     with transaction.atomic():
    #         user = self.context.get("request_user")
    #         user.title = validated_data.get("title", user.title)
    #         user.bio = validated_data.get("bio", user.bio)
    #         user.website = validated_data.get("website", user.website)
    #         user.focus = validated_data.get("focus", user.focus)
    #         user.years_of_experience = validated_data.get(
    #             "years_of_experience",
    #             user.years_of_experience
    #         )
    #         user.instagram_handle = validated_data.get(
    #             "instagram_handle",
    #             user.instagram_handle
    #         )
    #         if validated_data.get("profile_image"):
    #             user.profile_image = validated_data.get("profile_image")
    #
    #         if validated_data.get("location"):
    #             user.location = validated_data.get("location")
    #
    #         if validated_data.get("phone_number"):
    #             user.phone_number = validated_data.get("phone_number")
    #
    #         # Ambassador
    #         if validated_data.get("instagram_handle"):
    #             user.instagram_handle = validated_data.get("instagram_handle")
    #         if validated_data.get("instagram_follower"):
    #             user.instagram_follower = validated_data.get("instagram_follower")
    #
    #             # TikTok
    #         if validated_data.get("tiktok_handle"):
    #             user.tiktok_handle = validated_data.get("tiktok_handle")
    #         if validated_data.get("tiktok_follower"):
    #             user.tiktok_follower = validated_data.get("tiktok_follower")
    #
    #             # YouTube
    #         if validated_data.get("youtube_handle"):
    #             user.youtube_handle = validated_data.get("youtube_handle")
    #         if validated_data.get("youtube_subscribers"):
    #             user.youtube_subscribers = validated_data.get("youtube_subscribers")
    #
    #             # Twitter / X
    #         if validated_data.get("twitter_handle"):
    #             user.twitter_handle = validated_data.get("twitter_handle")
    #         if validated_data.get("twitter_follower"):
    #             user.twitter_follower = validated_data.get("twitter_follower")
    #
    #             # Primary platform & niche
    #         user.primary_platform = validated_data.get("primary_platform", user.primary_platform)
    #         user.content_niche = validated_data.get("content_niche", user.content_niche)
    #
    #         user.profile_step = 2
    #         user.save()
    #         return {"user": UserFinalMarketSerializer(user, context={"request": self.context.get("request")}).data}


class UserIntersetSerializer(serializers.Serializer):
    art_style = serializers.JSONField(required=False)
    geographic_interset = serializers.JSONField(required=False)
    preferred_time_periods = serializers.JSONField(required=False)
    price_interset = serializers.CharField(required=True)

    def create(self, validated_data):
        with transaction.atomic():
            request_user = self.context.get("request_user")
            interset_setup, created = IntersetReward.objects.update_or_create(
                user=request_user,
                defaults={
                    "art_style": validated_data.get("art_style", []),
                    "geographic_interset": validated_data.get(
                        "geographic_interset", []
                    ),
                    "preferred_time_periods": validated_data.get(
                        "preferred_time_periods", []
                    ),
                    "price_interset": validated_data.get("price_interset"),
                },
            )

            request_user.profile_step = 3
            request_user.save(update_fields=["profile_step"])

            interset_data = {
                "id": interset_setup.id,
                "art_style": interset_setup.art_style,
                "geographic_interset": interset_setup.geographic_interset,
                "preferred_time_periods": interset_setup.preferred_time_periods,
                "price_interset": interset_setup.price_interset,
                "user": UserFinalMarketSerializer(interset_setup.user).data,
            }
            return interset_data


class KYCVerificationSerializer(serializers.Serializer):
    id_type = serializers.ChoiceField(
        choices=CHOICES_IN_KYC,
        required=False,
        error_messages={
            "invalid_choice": "Invalid id_type selected. id_type must be one of: Passport, National ID, Emirates ID, Iqama (Saudi Residency), Driver's License"
        },
    )
    id_number = serializers.CharField(required=False)
    dob = serializers.DateField(required=False)
    country = serializers.CharField(required=False)
    state = serializers.CharField(required=False)
    street_address = serializers.CharField(required=False)
    city = serializers.CharField(required=False)
    postal_code = serializers.CharField(required=False)
    gov_issued_id = serializers.FileField(required=False)
    proof_address = serializers.FileField(required=False)
    gov_issued_id_front = serializers.FileField(required=False)
    gov_issued_id_back = serializers.FileField(required=False)
    social_link_handler = serializers.CharField(required=False)
    social_link_followers = serializers.CharField(required=False)

    def create(self, validated_data):
        request_user = self.context.get("request_user")

        kyc, created = KYCVerification.objects.get_or_create(user=request_user)

        kyc.id_number = validated_data.get("id_number", kyc.id_number)
        kyc.id_type = validated_data.get("id_type", kyc.id_type)
        kyc.street_address = validated_data.get("street_address", kyc.street_address)
        kyc.dob = validated_data.get("dob", kyc.dob)
        kyc.country = validated_data.get("country", kyc.country)
        kyc.state = validated_data.get("state", kyc.state)
        kyc.city = validated_data.get("city", kyc.city)
        kyc.postal_code = validated_data.get("postal_code", kyc.postal_code)
        kyc.social_link_handler = validated_data.get(
            "social_link_handler", kyc.social_link_handler
        )
        kyc.social_link_followers = validated_data.get(
            "social_link_followers", kyc.social_link_followers
        )

        gov_file = validated_data.get("gov_issued_id")
        address_file = validated_data.get("proof_address")
        gov_issued_id_front = validated_data.get("gov_issued_id_front")
        gov_issued_id_back = validated_data.get("gov_issued_id_back")

        if gov_file:
            kyc.gov_issued_id = gov_file

        if address_file:
            kyc.proof_address = address_file

        if gov_issued_id_front:
            kyc.gov_issued_id_front = gov_issued_id_front

        if gov_issued_id_back:
            kyc.gov_issued_id_back = gov_issued_id_back

        required_fields_filled = all(
            [
                kyc.id_number,
                kyc.dob,
                kyc.country,
                kyc.city,
                kyc.postal_code,
                kyc.gov_issued_id,
                kyc.proof_address,
                kyc.gov_issued_id_front,
                kyc.gov_issued_id_back,
            ]
        )

        if required_fields_filled and not kyc.is_kyc_completed:
            current_points = int(request_user.points or 0)
            request_user.points = str(current_points + 150)
            kyc.is_kyc_completed = True

        kyc.save()

        request_user.profile_step = 4
        request_user.save(update_fields=["points", "profile_step"])
        request = self.context.get("request")
        return {
            "id": kyc.id,
            "id_number": kyc.id_number,
            "id_type": kyc.id_type,
            "dob": kyc.dob,
            "street_address": kyc.street_address,
            "state": kyc.state,
            "city": kyc.city,
            "postal_code": kyc.postal_code,
            "gov_issued_id": (
                request.build_absolute_uri(kyc.gov_issued_id.url)
                if kyc.gov_issued_id and request
                else None
            ),
            "gov_issued_id_front": (
                request.build_absolute_uri(kyc.gov_issued_id_front.url)
                if kyc.gov_issued_id_front and request
                else None
            ),
            "gov_issued_id_back": (
                request.build_absolute_uri(kyc.gov_issued_id_back.url)
                if kyc.gov_issued_id_back and request
                else None
            ),
            "proof_address": (
                request.build_absolute_uri(kyc.proof_address.url)
                if kyc.proof_address and request
                else None
            ),
            "is_kyc_completed": kyc.is_kyc_completed,
            "social_link_handler": kyc.social_link_handler,
            "social_link_followers": kyc.social_link_followers,
            "user": UserFinalMarketSerializer(request_user).data,
        }


class UserRewardSerializer(serializers.Serializer):
    goal_type = serializers.JSONField(required=True)
    points_reward = serializers.JSONField(required=True)

    def create(self, validated_data):
        request_user = self.context.get("request_user")
        existing = IntersetReward.objects.filter(user=request_user).first()
        is_first_time = False
        if existing is None:
            is_first_time = True
        else:
            if (
                not existing.goal_type
                or len(existing.goal_type) == 0
                and not existing.points_reward
            ):
                is_first_time = True

        if existing:
            existing.goal_type = validated_data.get("goal_type", [])
            existing.points_reward = validated_data.get("points_reward", [])
            existing.save(update_fields=["goal_type", "points_reward"])
            reward_setup = existing
        else:
            reward_setup = IntersetReward.objects.create(
                user=request_user,
                goal_type=validated_data.get("goal_type"),
                points_reward=validated_data.get("points_reward"),
            )
        rewards = validated_data.get("points_reward", [])
        total_reward = 0
        for reward in rewards:
            total_reward += int(reward)
        request_user.profile_step = 5
        request_user.profile_completed = True
        if is_first_time:
            current_points = int(request_user.points or "0")
            request_user.points = str(current_points + total_reward)
        request_user.save(update_fields=["profile_step", "profile_completed", "points"])

        return {
            "id": reward_setup.id,
            "art_style": reward_setup.art_style,
            "geographic_interset": reward_setup.geographic_interset,
            "preferred_time_periods": reward_setup.preferred_time_periods,
            "price_interset": reward_setup.price_interset,
            "goal_type": reward_setup.goal_type,
            "points_reward": reward_setup.points_reward,
            "user": UserFinalMarketSerializer(reward_setup.user).data,
        }


class IntersetRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntersetReward
        fields = [
            "id",
            "art_style",
            "geographic_interset",
            "preferred_time_periods",
            "price_interset",
            "goal_type",
            "points_reward",
        ]


class KycVerificationDetailSerializer(serializers.ModelSerializer):
    gov_issued_id = serializers.SerializerMethodField()
    proof_address = serializers.SerializerMethodField()
    gov_issued_id_front = serializers.SerializerMethodField()
    gov_issued_id_back = serializers.SerializerMethodField()

    class Meta:
        model = KYCVerification
        fields = [
            "id",
            "id_number",
            "dob",
            "country",
            "state",
            "city",
            "postal_code",
            "gov_issued_id",
            "proof_address",
            "gov_issued_id_front",
            "gov_issued_id_back",
            "id_type",
            "street_address",
            "social_link_handler",
            "social_link_followers",
            'status'
        ]

    def get_gov_issued_id(self, obj):
        request = self.context.get("request")
        if obj.gov_issued_id and request:
            return request.build_absolute_uri(obj.gov_issued_id.url)
        return None

    def get_proof_address(self, obj):
        request = self.context.get("request")
        if obj.proof_address and request:
            return request.build_absolute_uri(obj.proof_address.url)
        return None

    def get_gov_issued_id_front(self, obj):
        request = self.context.get("request")
        if obj.gov_issued_id_front and request:
            return request.build_absolute_uri(obj.gov_issued_id_front.url)
        return None

    def get_gov_issued_id_back(self, obj):
        request = self.context.get("request")
        if obj.gov_issued_id_back and request:
            return request.build_absolute_uri(obj.gov_issued_id_back.url)
        return None


class UserDetailsSerializer(serializers.Serializer):
    user = UserFinalMarketSerializer(source="*")
    kyc_verification = KycVerificationDetailSerializer()
    interest_rewards = IntersetRewardSerializer(many=True, source="user_profile")

    def to_representation(self, instance):
        context = self.context
        data = super().to_representation(instance)
        kyc = getattr(instance, "kyc_verification", None)

        data["kyc_verification"] = (
            KycVerificationDetailSerializer(kyc, context=context).data if kyc else None
        )
        return data


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["id", "name", "created_at", "updated_at"]


class RefreshTokenSerializers(serializers.Serializer):
    refresh_token = serializers.CharField(required=True)


class WatchEarnSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    link = serializers.CharField(required=True)
    points = serializers.CharField(required=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = WatchEarn
        fields = ["id", "title", "link", "points", "created_at", "is_completed"]

    def get_is_completed(self, obj):
        user = self.context.get("request").user
        if user.is_anonymous:
            return False
        return UserWatchEarn.objects.filter(
            user=user, watch=obj, is_completed=True
        ).exists()


class RedemptionSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=True)
    code = serializers.CharField(required=True)
    points = serializers.CharField(required=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Redemption
        fields = ["id", "title", "code", "points", "created_at", "is_completed"]

    def get_is_completed(self, obj):
        user = self.context.get("request").user
        if user.is_anonymous:
            return False
        return UserRedemption.objects.filter(
            user=user, redeem=obj, is_completed=True
        ).exists()


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = "__all__"
        read_only_fields = ("user",)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class UserGetSettingsSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserSettings
        fields = "__all__"


class UserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user

        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if not user.check_password(current_password):
            raise serializers.ValidationError(
                {"current_password": "Current password is incorrect."}
            )

        if current_password == new_password:
            raise serializers.ValidationError(
                {"new_password": "New password cannot be same as current password."}
            )

        if new_password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": "New password and confirm password do not match."}
            )

        if len(new_password) < 8:
            raise serializers.ValidationError(
                {"new_password": "Password must be at least 8 characters long."}
            )

        if not re.search(r"[A-Z]", new_password):
            raise serializers.ValidationError(
                {"new_password": "Password must contain at least one uppercase letter."}
            )

        if not re.search(r"[a-z]", new_password):
            raise serializers.ValidationError(
                {"new_password": "Password must contain at least one lowercase letter."}
            )

        if not re.search(r"\d", new_password):
            raise serializers.ValidationError(
                {"new_password": "Password must contain at least one digit."}
            )

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", new_password):
            raise serializers.ValidationError(
                {
                    "new_password": "Password must contain at least one special character."
                }
            )

        return attrs

    def save(self, **kwargs):
        user = self.context.get("request").user
        new_password = self.validated_data.get("new_password")

        user.set_password(new_password)
        user.save()
        return user


class ProgressionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progression
        fields = ["id", "name", "points"]


class LeaderBoardDetailsSerializer(serializers.ModelSerializer):
    tier = serializers.SerializerMethodField()
    rank = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "username",
            "role",
            "profile_image",
            "points",
            "tier",
            "rank",
            "created_at",
        ]

    def get_tier(self, user):
        pts = int(user.points or 0)
        if pts < 500:
            return "Explorer"
        elif pts < 2000:
            return "Curator"
        elif pts < 5000:
            return "Ambassador"
        else:
            return "Founding Patron"


class UserLeaderBoardDetailsSerializer(serializers.ModelSerializer):
    tier = serializers.SerializerMethodField()
    rank = serializers.IntegerField(read_only=True)
    is_follow = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "username",
            "role",
            "profile_image",
            "points",
            "tier",
            "rank",
            "is_follow",
            "created_at",
        ]

    def get_tier(self, user):
        pts = int(user.points or 0)
        if pts < 500:
            return "Explorer"
        elif pts < 5000:
            return "Ambassador"
        else:
            return "Founding Patron"

    def get_is_follow(self, user):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return UserFollower.objects.filter(
            follow_by=request.user, follow_to=user
        ).exists()
class UserFollowLeaderBoardSerializers(serializers.ModelSerializer):
    follow_to = serializers.SlugRelatedField(
        queryset=User.objects.all(), required=True, slug_field="id"
    )

    class Meta:
        model = UserFollower
        fields = "__all__"
        read_only_fields = ("follow_by",)

    def validate(self, attrs):
        user = self.context["request"].user
        follow_to = attrs.get("follow_to")

        if user == follow_to:
            raise serializers.ValidationError({"follow_to": "You cannot follow yourself."})

        return attrs

    def _artist_gallery_count(self, user):
        return UserFollower.objects.filter(
            follow_by=user,
            follow_to__role__in=["Artist", "Gallery"],
        ).count()

    def create(self, validated_data):
        request_user = self.context["request"].user
        follow_to = validated_data["follow_to"]

        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request_user.pk)

            count_before = self._artist_gallery_count(user)

            existing = UserFollower.objects.filter(
                follow_by=user, follow_to=follow_to
            ).first()
            if existing:
                existing.delete()
                self._toggled_followed = False

                count_after = self._artist_gallery_count(user)
                if count_before >= 5 and count_after < 5:
                    current_points = int(user.points or 0)
                    user.points = str(max(0, current_points - 50))
                    user.save(update_fields=["points"])
                return existing

            # ✅ FOLLOW
            follow = UserFollower.objects.create(follow_by=user, follow_to=follow_to)
            self._toggled_followed = True

            count_after = self._artist_gallery_count(user)
            if count_before < 5 and count_after >= 5:
                current_points = int(user.points or 0)
                user.points = str(current_points + 50)
                user.save(update_fields=["points"])

            return follow

class ArtistRoasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistRoaster
        fields = "__all__"

    def validate_email(self, value):
        instance = self.instance
        qs = ArtistRoaster.objects.filter(email__iexact=value)
        if instance:
            qs = qs.exclude(id=instance.id)
        if qs.exists():
            raise serializers.ValidationError("Email already exists.")

        return value


class ArtworkCollectionSerializer(serializers.ModelSerializer):
    category = serializers.ChoiceField(
        choices=CHOICES_IN_ARTWORK_CATEGORY,
        required=False,
        error_messages={
            "invalid_choice": "Invalid category selected. category must be one of: Contemporary, Digital, Traditional, Photography, Sculpture"
        },
    )

    class Meta:
        model = ArtworkCollection
        fields = [
            "id",
            "title",
            "artist_name",
            "year",
            "medium",
            "category",
            "acquisition_date",
            "purchase_value",
            "description",
            "dimensions",
            "image",
            "created_at",
        ]

    def create(self, validated_data):
        collection = ArtworkCollection.objects.create(**validated_data)
        points = ArtworkCollectionPoints.objects.filter(user=collection.user).count()
        if points >= 25:
            return collection
        ArtworkCollectionPoints.objects.create(user=collection.user, collection=collection)
        user = collection.user
        current_points = int(user.points or 0)
        user.points = str(current_points + 25)
        user.save(update_fields=["points"])
        return collection


class InstagramFollowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstagramFollowers
        fields = "__all__"


class TwitterFollowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TwitterFollowers
        fields = "__all__"


class YoutubeSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = YoutubeSubscribers
        fields = "__all__"


class TiktokFollowerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TikTokFollowers
        fields = "__all__"


class PrimaryPlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrimaryPlatform
        fields = "__all__"


class ArtworkArtistCollectionSerializer(serializers.ModelSerializer):
    user_type = serializers.ChoiceField(
        choices=CHOICES_IN_ART_ROLE,
        required=False,
        error_messages={
            "invalid_choice": "Invalid user_type selected. user_type must be one of: Gallery, Artist, Collector"
        },
    )

    class Meta:
        model = ArtworkArtistCollection
        fields = [
            "id",
            "image",
            "title",
            "price",
            "dimensions",
            "medium",
            "description",
            "no_artist",
            "user_type",
            "created_at",
        ]


class PriceRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceRange
        fields = "__all__"


# class AllArtworkArtistCollectionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ArtworkArtistCollection
#         fields = "__all__"


class ViewUserProfileSerializer(serializers.ModelSerializer):
    artworks = serializers.SerializerMethodField()
    user_stats = serializers.SerializerMethodField()
    kyc_verification = serializers.SerializerMethodField()
    interest_rewards = IntersetRewardSerializer(many=True, source="user_profile")

    class Meta:
        model = User
        exclude = ("password",)
        depth = 1

    def get_kyc_verification(self, user):
        kyc = getattr(user, "kyc_verification", None)
        if kyc:
            return KycVerificationDetailSerializer(kyc, context=self.context).data
        return None

    def get_artworks(self, user):
        artworks = ArtworkArtistCollection.objects.filter(user=user)
        return ArtworkArtistCollectionSerializer(artworks, many=True).data

    def get_user_stats(self, user):
        request_user = self.context["request"].user
        referral_count = UserReferral.objects.filter(referenced_by=user).count()

        followers = UserFollower.objects.filter(follow_to=user).count()

        following = UserFollower.objects.filter(follow_by=user).count()

        is_follow = False
        if request_user.is_authenticated:
            is_follow = UserFollower.objects.filter(
                follow_by=request_user, follow_to=user
            ).exists()

        user_points = int(user.points or "0")

        tiers = [
            ("Explorer", 0, 500),
            ("Curator", 501, 1500),
            ("Patron", 1501, 3500),
            ("Ambassador", 3501, 7500),
            ("Founding Patron", 7501, float("inf")),
        ]

        tier_name = ""
        next_tier_name = ""
        next_tier_need = 0
        tier_progress = 100

        for i, (name, min_p, max_p) in enumerate(tiers):
            if min_p <= user_points <= max_p:
                tier_name = name

                if max_p != float("inf"):
                    tier_progress = round(
                        ((user_points - min_p) / (max_p - min_p)) * 100,
                        2,
                    )

                if i < len(tiers) - 1:
                    next_tier_name = tiers[i + 1][0]
                    next_tier_need = max(tiers[i + 1][1] - user_points, 0)
                break

        influence_points = round((referral_count * 100) * 0.20, 2)

        video_watched = UserWatchEarn.objects.filter(
            user=user, is_completed=True
        ).count()

        artwork_count = ArtworkArtistCollection.objects.filter(user=user).count()

        leaderboard_data = get_user_leaderboard_rank(user)
        user_rank = leaderboard_data["rank"]
        out_of = leaderboard_data["out_of"]

        social_data = {
            "instagram_follower": getattr(user.instagram_follower, "range", None),
            "instagram_engagement": 4.2,
            "instagram_post": 124,
            "tiktok_follower": getattr(user.tiktok_follower, "range", None),
            "tiktok_engagement": 6.8,
            "tiktok_post": 89,
            "youtube_subscriber": getattr(user.youtube_subscribers, "range", None),
            "youtube_engagement": 3.1,
            "youtube_post": 34,
            "twitter_follower": getattr(user.twitter_follower, "range", None),
            "twitter_engagement": 2.4,
            "twitter_post": 312,
        }

        return {
            "user_rank": user_rank,
            "out_of": out_of,
            "referral_count": referral_count,
            "followers": followers,
            "following": following,
            "is_follow": is_follow,
            "tier": {
                "current_tier": tier_name,
                "next_tier": next_tier_name,
                "points_needed": next_tier_need,
                "progress_percent": tier_progress,
            },
            "influence_points": influence_points,
            "provenance_points": 0,
            "video_watched": video_watched,
            "artworks_added_count": artwork_count,
            "social_data": social_data,
        }


class UserFeedBackSerializer(serializers.ModelSerializer):
    feedback_category = serializers.ChoiceField(
        choices=CHOICES_IN_CATEGORY,
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            "invalid_choice": "Invalid feedback_category selected. feedback_category must be one of: New Feature, "
            "Improvement, Integration, User Experience, Community Features, Other"
        },
    )
    feedback_about = serializers.ChoiceField(
        choices=CHOICES_IN_FEEDBACK,
        required=False,
        allow_null=True,
        allow_blank=True,
        error_messages={
            "invalid_choice": "Invalid feedback_about selected. feedback_about must be one of: "
            "Performance Experience, Features & Functionality, Design & Interface, "
            "Performance & Speed, Customer Support, Other"
        },
    )
    title = serializers.CharField(required=False)
    describe_idea = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    sentiment = serializers.CharField(required=False)

    class Meta:
        model = UserFeedBack
        fields = [
            "id",
            "title",
            "describe_idea",
            "feedback",
            "email",
            "feedback_category",
            "feedback_about",
            "sentiment",
        ]


class UserReportBugSerializer(serializers.ModelSerializer):
    bug_category = serializers.ChoiceField(
        choices=CHOICES_IN_BUG_REPORT_CATEGORY,
        required=False,
        error_messages={
            "invalid_choice": "Invalid feedback_category selected. feedback_category must be one of: "
            "UI/UX Issue, Performance, Functionality, "
            "Security, Data Issue, Other"
        },
    )
    title = serializers.CharField(required=False)
    severity = serializers.CharField(required=False)
    description = serializers.CharField(required=False)
    device_info = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    bug_image = serializers.FileField(required=False)

    class Meta:
        model = UserReportBug
        fields = [
            "id",
            "title",
            "bug_category",
            "bug_image",
            "severity",
            "description",
            "device_info",
            "email",
        ]

class UserBugDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']

class UserReportBugListingSerializer(serializers.ModelSerializer):
    user = UserBugDetailSerializer()
    class Meta:
        model = UserReportBug
        fields = '__all__'