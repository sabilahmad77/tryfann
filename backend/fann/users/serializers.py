from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.utils.translation import gettext_lazy as _
from fann.artist.models import ArtistShop, Art, Order
from fann.artist.serializers import ArtistPortFolioSerializer, ShopListingSerializer
from fann.users.models import (
    User,
    KYCSubmission,
    UserWebsites,
    SocialMedia,
    UserPortfolio,
    NotificationSetting,
    PreferenceSetting,
    ArtistPortFolio,
    UserVerifications,
    OrgSecuritySetting,
    CommunityChallenge, KYCVerification, UserAccount, UserWithDrawRequests, BankAccount,
)
from fann.users.utils import generate_random_string, send_email
import random
from django.utils import timezone


class UserSignUpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={"input_type": "password"})
    first_name = serializers.CharField(allow_null=True, allow_blank=True)
    last_name = serializers.CharField(allow_null=True, allow_blank=True)
    address = serializers.CharField(style={"input_type": "address"})
    role = serializers.CharField(style={"input_type": "role"})
    organization_name = serializers.CharField(allow_null=True, allow_blank=True)
    admin_contact_name = serializers.CharField(allow_null=True, allow_blank=True)

    def validate_email(self, value):
        user = User.objects.filter(email=value).first()
        if user:
            raise serializers.ValidationError("Email already registered")
        return value

    def validate_role(self, value):
        if value not in ["Customer", "Artist", "Organization"]:
            raise serializers.ValidationError("Invalid role")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            email = validated_data.pop("email")
            password = validated_data.pop("password")
            first_name = validated_data.pop("first_name")
            last_name = validated_data.pop("last_name")
            address = validated_data.pop("address")
            role = validated_data.pop("role")
            organization_name = validated_data.pop("organization_name")
            admin_contact_name = validated_data.pop("admin_contact_name")
            user = User.objects.create(
                email=email,
                first_name=first_name,
                last_name=last_name,
                address=address,
                role=role,
                organization_name=organization_name,
                admin_contact_name=admin_contact_name,
                is_verify=False,
            )
            user.set_password(password)
            user.save()
            code = generate_random_string()
            UserVerifications.objects.create(user=user, code=code, email=user.email)
            context = {
                "platform_name": "Fann Tech Art",
                "verification_url": f"https://app.globaltechserivce.com//verify-email?email={email}&token={code}",
                "support_email": f"fantech@info.com",
            }
            send_email(
                context=context,
                template_path="user_verification.html",
                user_email=email,
                subject="User Verification",
            )
            return user


class KYCSubmissionSerializer(serializers.ModelSerializer):

    class Meta:
        model = KYCSubmission
        fields = "__all__"


class LoginTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Authenticates credentials; sets self.user if valid
        data = super().validate(attrs)

        # hard gate on verification BEFORE issuing tokens
        if not getattr(self.user, "is_verify", False):
            raise AuthenticationFailed(
                "Account not verified.", code="user_not_verified"
            )

        if self.user.is_deleted:
            raise serializers.ValidationError(
                {"error": _("Access denied. This account does not exists.")}
            )

        restricted_roles = ["Collector", "Ambassador", "Investor"]
        if self.user.role in restricted_roles:
            raise serializers.ValidationError(
                {
                    "error": _(
                        "Access denied. This account is not allowed to login here, Use Try Market for login."
                    )
                }
            )

        if not self.user.fann_2fa:
            refresh = self.get_token(self.user)
            data["refresh"] = str(refresh)
            data["access"] = str(refresh.access_token)
            data["email"] = self.user.email
            data["first_name"] = self.user.first_name
            data["last_name"] = self.user.last_name
            return data

        otp = str(random.randint(100000, 999999))
        self.user.fann_2fa_otp = otp
        self.user.fann_2fa_otp_created = timezone.now()
        self.user.save()
        context = {
            "platform_name": "Fann Tech Art",
            "otp": otp,
            "support_email": f"fantech@info.com",
        }
        send_email(
            context=context,
            template_path="emails/user_fann_otp.html",
            user_email=self.user.email,
            subject="Fann 2FA OTP",
        )
        return {
            "2fa_required": True,
            "user_id": self.user.id,
            "message": "OTP sent to email",
        }


class UserWebsitesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWebsites
        fields = "__all__"


class UserSocialMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMedia
        fields = "__all__"


class UserPortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPortfolio
        fields = "__all__"


class UserDetailSerializer(serializers.ModelSerializer):
    kyc_submission = serializers.SerializerMethodField(method_name="get_kyc_submission")
    wallet = serializers.SerializerMethodField(method_name='get_wallet')
    social_media = serializers.SerializerMethodField(method_name="get_social_media")
    user_websites = serializers.SerializerMethodField(method_name="get_user_websites")
    portfolio = serializers.SerializerMethodField(method_name="get_portfolio")
    collection_overview = serializers.SerializerMethodField(
        method_name="get_collection_overview"
    )
    shops = serializers.SerializerMethodField(method_name="get_shops")
    socials = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )
    website = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "role",
            "address",
            "banner",
            "profile_image",
            "bio",
            "location",
            "timezone",
            "kyc_submission",
            "social_media",
            "website",
            "collection_overview",
            "shops",
            "user_websites",
            "portfolio",
            "socials",
            "created_at",
            "user_contract",
            "wallet"
        ]
        extra_kwargs = {
            "socials": {"required": False},
            "website": {"required": False},
            "interests": {"required": False},
        }

    def get_wallet(self, obj):
        wallet = UserAccount.objects.get_or_create(user=obj)[0]
        return {
            "currency": wallet.currency,
            "available_balance": wallet.available_balance,
        }

    def get_collection_overview(self, obj):
        arts = Art.objects.filter(artist=obj).count()
        return {
            "art_counts": arts,
            "total_spent": 25353,
            "following_arts": 23,
            "events_attend": 3,
        }

    def get_shops(self, obj):
        shops = ArtistShop.objects.filter(artist=obj)
        return ShopListingSerializer(shops, many=True).data

    def get_portfolio(self, obj):
        port_folio = ArtistPortFolio.objects.filter(artist=obj)
        return ArtistPortFolioSerializer(port_folio, many=True).data

    def get_social_media(self, obj):
        return obj.social_media

    def get_kyc_submission(self, obj):
        try:
            kyc = obj.kyc  # this matches the related_name='kyc'
            return KYCSubmissionSerializer(kyc).data
        except KYCSubmission.DoesNotExist:
            return None

    def get_social_media(self, obj):
        media = SocialMedia.objects.filter(user=obj)
        return SocialMediaSerializer(media, many=True).data

    def get_user_websites(self, obj):
        websites = UserWebsites.objects.filter(user=obj)
        return UserWebsitesSerializer(websites, many=True).data


class AdminUserSerializer(serializers.ModelSerializer):
    kyc_submission = serializers.SerializerMethodField(method_name="get_kyc_submission")
    kyc_status = serializers.SerializerMethodField(method_name="get_kyc_status")

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "kyc_status",
            "date_joined",
            "is_active",
            "kyc_submission",
        ]

    def get_kyc_submission(self, obj):
        try:
            kyc = obj.kyc  # related_name='kyc'
            return KYCSubmissionSerializer(kyc).data
        except KYCSubmission.DoesNotExist:
            return None

    def get_kyc_status(self, obj):
        try:
            return obj.kyc.status  # Adjust based on your KYCSubmission model
        except KYCSubmission.DoesNotExist:
            return None


class KYCActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    note = serializers.CharField(required=False)


class SocialMediaSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)


class WebsiteSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)


class UserSocialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMedia
        fields = "__all__"


class UpdateProfileSerializer(serializers.ModelSerializer):
    social_media = SocialMediaSerializer(many=True)
    websites = WebsiteSerializer(many=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "address",
            "location",
            "bio",
            "timezone",
            "social_media",
            "websites",
            "language",
            "phone_number",
        ]

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get("first_name")
        instance.last_name = validated_data.get("last_name")
        instance.address = validated_data.get("address")
        instance.location = validated_data.get("location")
        instance.bio = validated_data.get("bio")
        instance.timezone = validated_data.get("timezone")
        instance.save()
        social_media = validated_data.get("social_media")
        websites = validated_data.get("websites")
        if websites:
            UserWebsites.objects.filter(user=instance).delete()
        if social_media:
            SocialMedia.objects.filter(user=instance).delete()
        for website in websites:
            UserWebsites.objects.update_or_create(name=website["name"], user=instance)
        for media in social_media:
            SocialMedia.objects.update_or_create(name=media["name"], user=instance)
        return instance


class OrganizationSellerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "address",
            "location",
            "email",
            "password",
            "timezone",
            "role",
            "organization",
            "is_active",
            "created_at",
        ]


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = "__all__"


class PreferenceSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferenceSetting
        fields = "__all__"


class ResetPasswordSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=100)

    class Meta:
        model = User
        fields = ("password",)

    def update(self, instance, validated_data):
        instance.set_password(validated_data["password"])
        instance.save()
        return instance


class Verify2FASerializers(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    otp = serializers.CharField(required=True)


class Setting2FASerializers(serializers.Serializer):
    enable = serializers.BooleanField(required=True)


class OrgSecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgSecuritySetting
        fields = "__all__"
        read_only_fields = ("user",)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class GetOrgSecuritySettingsSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrgSecuritySetting
        fields = "__all__"


class EditUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "address", "location"]

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class UserDataSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        exclude = ["password"]


class DeleteUserAccountSerializers(serializers.Serializer):
    delete_account = serializers.BooleanField(required=True)


class CommunityChallengeSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    participant_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CommunityChallenge
        fields = [
            "id",
            "user",
            "name",
            "deadline",
            "theme",
            "participant_count",
            "created_at",
            "updated_at",
        ]

class UserKycDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']

class KycSubmissionSerializer(serializers.ModelSerializer):
    user = UserKycDetailSerializer()
    class Meta:
        model = KYCVerification
        fields = "__all__"




class ArtPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for individual art performance"""
    view_count = serializers.IntegerField(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    revenue = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)

    class Meta:
        model = Art
        fields = [
            'id', 'title', 'image', 'price', 'category',
            'view_count', 'like_count', 'order_count', 'revenue'
        ]


class OrderAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for order analytics"""
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True)
    art_title = serializers.CharField(source='art.title', read_only=True)
    art_image = serializers.ImageField(source='art.image', read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_id', 'art_title', 'art_image', 'buyer_name',
            'status', 'tracking_id', 'shipped_at', 'eta', 'total',
            'created_at', 'payment_status'
        ]


class RevenueBreakdownSerializer(serializers.Serializer):
    """Serializer for revenue breakdown"""
    month = serializers.DateTimeField()
    revenue = serializers.DecimalField(max_digits=20, decimal_places=2)
    order_count = serializers.IntegerField()


class AudienceLocationSerializer(serializers.Serializer):
    """Serializer for audience by location"""
    country = serializers.CharField()
    collectors = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=20, decimal_places=2)
    percentage = serializers.FloatField(required=False)


class InsightSerializer(serializers.Serializer):
    """Serializer for AI insights"""
    type = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    icon = serializers.CharField()
    priority = serializers.CharField()
    action_required = serializers.BooleanField(default=False)
    action_url = serializers.URLField(required=False)


class OverviewMetricSerializer(serializers.Serializer):
    """Serializer for overview metrics"""
    value = serializers.FloatField()
    change = serializers.FloatField()
    label = serializers.CharField()
    trend = serializers.CharField(required=False)  # 'up', 'down', 'stable'


class AnalyticsOverviewSerializer(serializers.Serializer):
    """Complete overview serializer"""
    total_views = OverviewMetricSerializer()
    total_likes = OverviewMetricSerializer()
    total_collectors = OverviewMetricSerializer()
    total_revenue = OverviewMetricSerializer()
    period = serializers.CharField(default='month')


class UserWithDrawRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWithDrawRequests
        fields = '__all__'


class AdminWithDrawRequestSerializer(serializers.ModelSerializer):
    user = UserDataSerializer(read_only=True)
    class Meta:
        model = UserWithDrawRequests
        fields = '__all__'


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'