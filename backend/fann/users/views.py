import requests
from django.db import transaction
from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import UpdateModelMixin
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from django.db.models import Sum, Count, Avg, Q, F
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from datetime import timedelta, datetime
from decimal import Decimal
from collections import defaultdict
from fann.users.models import User, UserWithDrawRequests, BankAccount

from fann.artist.models import Art, Order, ArtViewCount, ArtWishList
from fann.common.model_mixins import TimestampMixin
from fann.common.permissions import IsSuperAdmin
from fann.common.response_mixins import BaseAPIView
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveAPIView,
    UpdateAPIView,
    DestroyAPIView,
)
from rest_framework_simplejwt.views import TokenObtainPairView

from fann.users.kyc_verfication import verify_blockchain_kyc, block_user, unblock_user
from fann.users.models import (
    KYCSubmission,
    User,
    UserPortfolio,
    SellerInvitation,
    NotificationSetting,
    PreferenceSetting,
    SocialMedia,
    VerificationCode,
    UserVerifications,
    OrgSecuritySetting,
    CommunityChallenge,
    ChallengeParticipant, KYCVerification,
)
from fann.users.serializers import (
    UserSignUpSerializer,
    LoginTokenSerializer,
    UserDetailSerializer,
    KYCSubmissionSerializer,
    KYCActionSerializer,
    AdminUserSerializer,
    UpdateProfileSerializer,
    OrganizationSellerSerializer,
    NotificationSettingSerializer,
    PreferenceSettingSerializer,
    UserSocialSerializer,
    ResetPasswordSerializer,
    Verify2FASerializers,
    Setting2FASerializers,
    OrgSecuritySettingsSerializer,
    GetOrgSecuritySettingsSerializer,
    EditUserProfileSerializer,
    UserDataSerializer,
    DeleteUserAccountSerializers,
    CommunityChallengeSerializer, KycSubmissionSerializer, UserWithDrawRequestSerializer,
    AdminWithDrawRequestSerializer, BankAccountSerializer,
)
from rest_framework.permissions import IsAuthenticated
from fann.notifications.tasks import notify_superadmin_new_user
from fann.users.utils import generate_random_string, send_email, forget_password_email
from datetime import datetime, timedelta


class UserCreateView(BaseAPIView, CreateAPIView):
    permission_classes = []
    queryset = None
    serializer_class = UserSignUpSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return self.send_bad_request_response(message=serializer.errors)
        user = serializer.save()
        return self.send_success_response(data=serializer.data)


class LoginViewSet(TokenObtainPairView):
    serializer_class = LoginTokenSerializer


class UserDetailView(BaseAPIView, RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        serializer = UserDetailSerializer(request.user, context={"user": request.user})
        return self.send_success_response(data=serializer.data)


class UpdateProfileBannerView(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UpdateProfileSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        if data.get("profile_image", None):
            user.profile_image = data["profile_image"]
        if data.get("banner", None):
            user.banner = data["banner"]
        user.save()
        return self.send_success_response(message="Profile image updated.")


class AddUserPortFolioView(CreateAPIView, BaseAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None  # OK since we override create()

    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist("files") or request.data.getlist("files")

        if not files:
            return self.send_bad_request_response("No files received.", status=400)

        with transaction.atomic():
            UserPortfolio.objects.filter(
                user=request.user
            ).delete()  # if this is intended
            objs = [UserPortfolio(file=f, user=request.user) for f in files]
            UserPortfolio.objects.bulk_create(objs)

        return self.send_success_response(
            message=f"User portfolio created ({len(objs)} file(s))."
        )


class KYCSubmitView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = KYCSubmissionSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = request.user.id
        serializer = KYCSubmissionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class KYCApprovalView(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = KYCSubmission.objects.all()
    serializer_class = KYCSubmissionSerializer

    def update(self, request, *args, **kwargs):
        user = request.user
        if user.role != "SuperAdmin":
            return self.send_bad_request_response(
                "Only Super Admin can approve/reject KYC"
            )

        kyc = self.get_object()
        action = request.data.get("action")  # 'approve' or 'reject'
        note = request.data.get("note", "")

        if action == "approve":
            kyc.status = "Approved"
        elif action == "reject":
            kyc.status = "Rejected"
        else:
            return self.send_bad_request_response("Invalid action")

        kyc.notes = note
        kyc.save()

        return self.send_success_response(data={"id": kyc.id, "status": kyc.status})


class KycBlockView(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = KYCSubmission.objects.all()
    serializer_class = KYCSubmissionSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        kyc = KYCSubmission.objects.filter(id=data["kyc_id"]).first()
        if not kyc:
            return self.send_bad_request_response("KYC not found.")
        if kyc.status == "Rejected":
            return self.send_bad_request_response("KYC already rejected.")
        block = block_user(kyc.wallet)
        if block["ok"]:
            kyc.status = "Rejected"
            kyc.tx = block["tx"]
            kyc.save()
            return self.send_success_response(data={"id": kyc.id, "status": block})
        return self.send_bad_request_response("KYC block failed.")


class KycUnBlockView(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = KYCSubmission.objects.all()
    serializer_class = KYCSubmissionSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        kyc = KYCSubmission.objects.filter(id=data["kyc_id"]).first()
        if not kyc:
            return self.send_bad_request_response("KYC not found.")
        if kyc.status == "Approved":
            return self.send_bad_request_response("KYC already approved.")
        un_block = unblock_user(kyc.wallet)
        if un_block:
            kyc.status = "Approved"
            kyc.tx = un_block["tx"]
            kyc.save()
            return self.send_success_response(data={"id": kyc.id, "status": un_block})
        return self.send_bad_request_response("KYC unblock failed.")


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        kyc_status = self.request.query_params.get("kyc_status")

        if search:
            queryset = queryset.filter(full_name__icontains=search)
        if kyc_status:
            queryset = queryset.filter(kyc_status=kyc_status)

        return queryset


class AdminUserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    lookup_field = "id"
    permission_classes = [IsAuthenticated, IsSuperAdmin]


class AdminKYCReviewView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = KYCActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        note = serializer.validated_data.get("note", "")

        if action == "approve":
            user.kyc_status = "approved"
        else:
            user.kyc_status = "rejected"

        user.save()

        return Response(
            {
                "message": f"KYC {action}d successfully",
                "user_id": user.id,
                "kyc_status": user.kyc_status,
            }
        )


from django.utils import timezone


class AdminDashboardKPIView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        total_users = User.objects.count()
        kyc_pending = User.objects.filter(kyc__status="pending").count()
        kyc_approved = User.objects.filter(kyc__status="approved").count()
        kyc_rejected = User.objects.filter(kyc__status="rejected").count()
        new_signups_today = User.objects.filter(
            date_joined__date=timezone.now().date()
        ).count()

        return Response(
            {
                "total_users": total_users,
                "kyc_pending": kyc_pending,
                "kyc_approved": kyc_approved,
                "kyc_rejected": kyc_rejected,
                "new_signups_today": new_signups_today,
            }
        )


class UpdateProfileAPI(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UpdateProfileSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        serializer = self.get_serializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class AdminApproveUserKYC(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UpdateProfileSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        status = data["kyc_status"]
        kyc = KYCSubmission.objects.filter(id=data["kyc_id"]).first()
        if not kyc:
            return self.send_bad_request_response(message="KYC not found")
        if status == "Approved":
            try:
                kyc_blockchain = verify_blockchain_kyc(
                    kyc.wallet, country=int(kyc.country_code)
                )
                if not kyc_blockchain:
                    return self.send_bad_request_response(
                        message="KYC on blockchain failed"
                    )
                kyc.status = "Approved"
                kyc.save()
                return self.send_success_response(message="KYC approved successfully")
            except Exception as e:
                return self.send_bad_request_response(message=str(e))
        elif status == "Rejected":
            kyc.status = "Rejected"
            kyc.save()
            return self.send_success_response(message="KYC rejected successfully")
        return self.send_bad_request_response(message="Invalid kyc status")


def validate_google_token(access_token):
    # Validate the token by calling the Google token info endpoint
    validate_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={access_token}"
    response = requests.get(validate_url)
    return response.json() if response.status_code == 200 else None


class GoogleLoginView(BaseAPIView, CreateAPIView):
    def create(self, request, *args, **kwargs):
        try:
            access_token = request.data.get("access_token")
            role = request.data.get("role")
            if access_token:
                # Validate the access token before fetching profile data
                token_info = validate_google_token(access_token)

                if not token_info:
                    return self.send_bad_request_response(
                        message="Invalid or expired access token."
                    )

                if token_info and token_info.get("email"):
                    user = User.objects.filter(email=token_info["email"]).first()
                    if not user:
                        name = token_info["name"].split(" ", 1)
                        first_name = name[0]
                        last_name = name[1] if len(name) > 1 else ""
                        user = User.objects.create_user(
                            first_name=first_name,
                            last_name=last_name,
                            email=token_info["email"],
                            role=role,
                            password=None,  # Don't set a hardcoded password
                        )

                    refresh = RefreshToken.for_user(user)
                    return self.send_success_response(
                        message="Login successful",
                        data={
                            "refresh": str(refresh),
                            "access": str(refresh.access_token),
                        },
                    )
                else:
                    return self.send_bad_request_response(
                        message="Email permission is not granted or email is not available."
                    )
            else:
                return self.send_bad_request_response(
                    message="No access token provided."
                )
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class SellerListingView(
    BaseAPIView, ListAPIView, UpdateAPIView, DestroyAPIView, CreateAPIView
):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = OrganizationSellerSerializer

    def list(self, request, *args, **kwargs):
        email = request.GET.get("email", None)
        first_name = request.GET.get("first_name", None)
        last_name = request.GET.get("last_name", None)
        address = request.GET.get("address", None)
        active = request.GET.get("active", None)
        user = User.objects.filter(organization=self.request.user)
        if active:
            user = user.filter(is_active=True)
        if email:
            user = user.filter(email__icontains=email)
        if first_name:
            user = user.filter(first_name__icontains=first_name)
        if last_name:
            user = user.filter(last_name__icontains=last_name)
        if address:
            user = user.filter(address__icontains=address)
        serializer = self.get_serializer(user, many=True)
        return self.send_success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data
        data["organization"] = self.request.user.id
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = kwargs["pk"]
        data = request.data
        data["organization"] = self.request.user.id
        seller = User.objects.filter(organization=self.request.user, id=pk).first()
        if not seller:
            return self.send_bad_request_response(message="Seller is not found.")
        serializer = self.get_serializer(seller, many=False)
        return self.send_success_response(data=serializer.data)

    def destroy(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        seller = User.objects.filter(organization=self.request.user, id=pk).first()
        if not seller:
            return self.send_bad_request_response(message="Seller is not found.")
        seller.delete()
        return self.send_success_response(message="Seller is deleted.")


class SellerStatsView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = None

    def list(self, request, *args, **kwargs):
        users = User.objects.filter(organization=self.request.user)
        arts = Art.objects.filter(artist__in=users)
        arts_count = arts.count()
        total_orders = Order.objects.filter(art__in=arts).count()
        response = {
            "total_sellers": users.count(),
            "arts_count": arts_count,
            "total_orders": total_orders,
        }
        return self.send_success_response(data=response)


class OrganizationUserView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = None

    def list(self, request, *args, **kwargs):
        users = User.objects.filter(organization=self.request.user)
        total_users = users.count()
        active_users = users.filter().count()
        pending_verifications = 2
        suspended = 4
        response = {
            "total_users": total_users,
            "active_users": active_users,
            "pending_verifications": pending_verifications,
            "suspended": suspended,
        }
        return self.send_success_response(data=response)


class InviteSellerView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = None

    def create(self, request, *args, **kwargs):
        if not request.user.role == "Organization":
            return self.send_bad_request_response(
                message="You are not an organization."
            )
        code = generate_random_string()
        email = request.data["email"]
        SellerInvitation.objects.create(user=request.user, code=code, email=email)
        context = {
            "organization_name": request.user.organization_name,
            "platform_name": "Fann Tech Art",
            "cta_url": f"https://fann.globaltechserivce.com/signup/{code}",
            "support_email": f"fantech@info.com",
        }
        send_email(context=context, template_path="invite_sellers.html", email=email)
        return self.send_success_response(message="Invitation sent.")


class NotificationSettingView(BaseAPIView, UpdateAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = NotificationSettingSerializer

    def update(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        data = request.data
        data["user"] = self.request.user.id
        notification_settings = NotificationSetting.objects.filter(
            id=pk, user=request.user
        ).first()
        if not notification_settings:
            return self.send_bad_request_response(
                message="Notification setting not found"
            )
        serializer = self.serializer_class(notification_settings, data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        notification_settings = NotificationSetting.objects.filter(user=request.user)
        if not notification_settings:
            NotificationSetting.objects.create(
                user=request.user,
                push=True,
                email=True,
                sms=True,
                newsletter=True,
                price_alerts=True,
                auction_reminder=True,
                event_invites=True,
            )
            notification_settings = NotificationSetting.objects.filter(
                user=request.user
            )
        serializer = self.serializer_class(notification_settings, many=True)
        return self.send_success_response(data=serializer.data)


class PreferenceSettingView(BaseAPIView, UpdateAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = PreferenceSettingSerializer

    def update(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        data = request.data
        data["user"] = self.request.user.id
        preference = PreferenceSetting.objects.filter(id=pk, user=request.user).first()
        if not preference:
            return self.send_bad_request_response(message="Preference not found")
        serializer = self.serializer_class(preference, data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        preference = PreferenceSetting.objects.filter(user=request.user)
        if not preference:
            PreferenceSetting.objects.create(
                user=request.user,
                currency="USD",
                language="English",
                show_collection=True,
                show_purchases=True,
                show_activity=True,
                allow_messages=True,
            )
            preference = PreferenceSetting.objects.filter(user=request.user)
        serializer = self.serializer_class(preference, many=True)
        return self.send_success_response(data=serializer.data)


class UserSocialView(
    BaseAPIView, UpdateAPIView, ListAPIView, CreateAPIView, DestroyAPIView
):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserSocialSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = self.request.user.id
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        social = SocialMedia.objects.filter(id=pk).first()
        if not social:
            return self.send_bad_request_response(message="Social not found")
        data = request.data
        data["user"] = self.request.user.id
        serializer = self.serializer_class(social, data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def destroy(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        social = SocialMedia.objects.filter(id=pk).first()
        if not social:
            return self.send_bad_request_response(message="Social not found")
        social.delete()
        return self.send_success_response(message="Social deleted.")


class UpdatePasswordView(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def update(self, request, *args, **kwargs):
        data = request.data
        password = data["password"]
        new_password = data["new_password"]
        if not password or not new_password:
            return self.send_bad_request_response(
                message="Password or new_password required"
            )
        user = request.user
        check_passowrd = user.check_password(password)
        if not check_passowrd:
            return self.send_bad_request_response(message="Incorrect old password")
        user.set_password(new_password)
        user.save()
        return self.send_success_response(message="Password updated.")


class ForgetPassword(CreateAPIView, BaseAPIView):
    serializer_class = None
    queryset = User.objects.all()
    permission_classes = []
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        try:
            email = request.data.get("email")
            user = User.objects.filter(email=email).first()
            if not user:
                return self.send_bad_request_response(message="User not found")
            forget_password_email(user=user, template="emails/password_reset.html")
            return self.send_success_response(
                message="Reset Password Email Sent successfully", data=user.email
            )
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ResetPassword(CreateAPIView, BaseAPIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = ResetPasswordSerializer
    queryset = None

    def create(self, request, *args, **kwargs):
        try:
            data = request.data
            verification_code = VerificationCode.objects.filter(
                code=request.data.get("code"),
            ).first()
            if not verification_code:
                return self.send_bad_request_response(
                    message="Verification code not found"
                )
            if not verification_code.is_active:
                return self.send_bad_request_response(
                    message="Verification code expired"
                )
            if not int(verification_code.code) == request.data.get("code"):
                return self.send_bad_request_response(
                    message="Verification code not matched"
                )
            verification_code.is_active = False
            verification_code.save()
            serializer = self.serializer_class(
                instance=verification_code.user, data=data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return self.send_success_response(
                    message="Password updated successfully"
                )
            return self.send_bad_request_response(message=serializer.errors)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class SwitchRoleView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        if not request.user.role in ["Customer", "Artist"]:
            return self.send_bad_request_response(message="Invalid request")
        if request.user.role == "Customer":
            request.user.role = "Artist"
            request.user.save()
            return self.send_success_response(message="Customer role updated")
        if request.user.role == "Artist":
            request.user.role = "Customer"
            request.user.save()
            return self.send_success_response(message="Artist role updated")
        return self.send_bad_request_response(message="Invalid request")


class UserVerificationEmail(BaseAPIView, ListAPIView, CreateAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        email = request.query_params.get("email", None)
        code = request.query_params.get("code", None)
        if not email or not code:
            return self.send_bad_request_response(message="Email or code required")
        verification_code = UserVerifications.objects.filter(
            email=email, code=code
        ).last()
        if not verification_code:
            return self.send_bad_request_response(message="Verification code not found")
        verification_code.is_active = False
        verification_code.user.is_verify = True
        verification_code.user.save()
        verification_code.save()
        return self.send_success_response(message="User Verified Successfully")

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", None)
        if not email:
            return self.send_bad_request_response(message="Email required")
        user = User.objects.filter(email=email).first()
        if not user:
            return self.send_bad_request_response(message="User not found")
        if user.is_verify:
            return self.send_bad_request_response(message="User already verified")
        verification_code = UserVerifications.objects.filter(
            email=email, is_active=True
        ).last()
        if not verification_code:
            code = generate_random_string()
            verification_code = UserVerifications.objects.create(
                email=email, code=code, user=user
            )
        context = {
            "platform_name": "Fann Tech Art",
            "verification_url": f"https://app.globaltechserivce.com//verify-email?email={email}&token={verification_code.code}",
            "support_email": f"fantech@info.com",
        }
        send_email(
            context=context,
            template_path="user_verification.html",
            user_email=email,
            subject="User Verification",
        )
        return self.send_success_response(
            message="Verification email sent successfully"
        )


class AddUserContractView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        contract = data["contract"]
        if not contract:
            return self.send_bad_request_response(message="Contract is required")
        user.user_contract = contract
        user.save()
        return self.send_success_response(message="Contract added successfully")


class Verify2FAView(BaseAPIView, CreateAPIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        try:
            serializer = Verify2FASerializers(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            user_id = request.data.get("user_id")
            otp = request.data.get("otp")
            user = User.objects.filter(id=user_id).first()

            if not user:
                return self.send_bad_request_response(message="User not found")

            if user.fann_2fa_otp != otp:
                return self.send_bad_request_response(message="Invalid OTP")

            if timezone.now() > user.fann_2fa_otp_created + timedelta(minutes=5):
                return self.send_bad_request_response(message="OTP expired")

            user.fann_2fa_otp = None
            user.save()
            refresh = RefreshToken.for_user(user)
            data = {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            }
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message="Invalid request")


class Setting2FAView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            serializer = Setting2FASerializers(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            status = request.data.get("enable")
            user = request.user
            user.fann_2fa = bool(status)
            user.save()
            return self.send_success_response(message="2FA settings updated")
        except Exception as e:
            return self.send_bad_request_response(message="Invalid request")


class OrgSecuritySettingsView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            settings_obj, created = OrgSecuritySetting.objects.get_or_create(user=user)
            serializer = OrgSecuritySettingsSerializer(
                settings_obj, data=request.data, partial=True
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save()
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class GetOrgSecuritySettingsView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            settings_obj, created = OrgSecuritySetting.objects.get_or_create(user=user)
            serializer = GetOrgSecuritySettingsSerializer(settings_obj)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class EditUserProfileView(BaseAPIView, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            user_id = request.data.get("user_id")
            if not user_id:
                return self.send_bad_request_response(message="user_id is required")
            user_obj = User.objects.filter(id=user_id).first()
            if not user_obj:
                return self.send_bad_request_response(message="user does not exist")
            serializer = EditUserProfileSerializer(
                user_obj, data=request.data, partial=True
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save()
            data = UserDataSerializer(user_obj).data
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class DeleteUserAccountView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            serializer = DeleteUserAccountSerializers(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            status = request.data.get("delete_account")
            # SECURITY: only ever act on the authenticated caller. Never trust a
            # client-supplied user_id (that was an IDOR — any user could delete
            # another). For a full GDPR erasure use /api/qualification/me/erase.
            user_obj = request.user
            if getattr(user_obj, "is_superuser", False):
                return self.send_bad_request_response(
                    message="Admin accounts cannot self-delete."
                )
            if status is True:
                user_obj.is_deleted = True
                user_obj.is_active = False
                user_obj.save(update_fields=["is_deleted", "is_active"])
                return self.send_success_response(
                    message="Account Deleted Successfully"
                )
            return self.send_success_response(message="Account Not Deleted")
        except Exception as e:
            return self.send_bad_request_response(message="Invalid request")


class CommunityChallengeViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = CommunityChallenge.objects.all().order_by("-id")
    serializer_class = CommunityChallengeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        challenge = serializer.save(user=self.request.user)
        ChallengeParticipant.objects.create(challenge=challenge, user=self.request.user)
        challenge.participant_count = challenge.participants.count()
        challenge.save()

    @action(detail=True, methods=["post"], url_path="join")
    def join_challenge(self, request, pk=None):
        try:
            challenge = self.get_object()
            user = request.user
            if ChallengeParticipant.objects.filter(
                challenge=challenge, user=user
            ).exists():
                return self.send_bad_request_response(message="Already joined")
            ChallengeParticipant.objects.create(challenge=challenge, user=user)
            challenge.participant_count = challenge.participants.count()
            challenge.save()
            return self.send_success_response(message="Joined successfully")
        except Exception as e:
            return self.send_bad_request_response(message="Invalid request")

    @action(detail=True, methods=["post"], url_path="leave")
    def leave_challenge(self, request, pk=None):
        try:
            challenge = self.get_object()
            user = request.user
            joined = ChallengeParticipant.objects.filter(challenge=challenge, user=user)
            if not joined.exists():
                return self.send_bad_request_response(
                    message="You have not joined this challenge"
                )

            joined.delete()
            challenge.participant_count = challenge.participants.count()
            challenge.save()
            return self.send_success_response(message="Left challenge successfully")
        except Exception as e:
            return self.send_bad_request_response(message="Invalid request")

class TryFanKycView(BaseAPIView, ListAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = KycSubmissionSerializer

    def list(self, request, *args, **kwargs):
        kyc = KYCVerification.objects.order_by("-id")
        serializer = self.get_serializer(kyc, many=True)
        return self.send_success_response(data=serializer.data)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        status = request.data.get("status")
        if status not  in ['Approved', 'Rejected']:
            return self.send_bad_request_response(message="Invalid status")
        kyc = KYCVerification.objects.filter(pk=pk).first()
        if not kyc:
            return self.send_bad_request_response(message="KYC does not exist")
        kyc.status = status
        kyc.save()
        return self.send_success_response(message="KYC Updated successfully")


"""
Analytics & Insights API Views
Provides comprehensive analytics for artists including performance, audience, revenue, and AI insights
"""


class AnalyticsOverviewView(BaseAPIView):
    """Get overview statistics with month-over-month comparison"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        artist = request.user

        # Date ranges
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(seconds=1)

        # Get artist's arts
        artist_arts = Art.objects.filter(artist=artist)

        # Total Views
        total_views = ArtViewCount.objects.filter(
            art__in=artist_arts
        ).aggregate(total=Sum('count'))['total'] or 0

        last_month_views = ArtViewCount.objects.filter(
            art__in=artist_arts,
            created_at__range=[last_month_start, last_month_end]
        ).aggregate(total=Sum('count'))['total'] or 0

        current_month_views = ArtViewCount.objects.filter(
            art__in=artist_arts,
            created_at__gte=current_month_start
        ).aggregate(total=Sum('count'))['total'] or 0

        views_change = self._calculate_percentage_change(
            last_month_views, current_month_views
        )

        # Total Likes (Wishlist)
        total_likes = ArtWishList.objects.filter(art__in=artist_arts).count()

        last_month_likes = ArtWishList.objects.filter(
            art__in=artist_arts,
            created_at__range=[last_month_start, last_month_end]
        ).count()

        current_month_likes = ArtWishList.objects.filter(
            art__in=artist_arts,
            created_at__gte=current_month_start
        ).count()

        likes_change = self._calculate_percentage_change(
            last_month_likes, current_month_likes
        )

        # Unique Collectors
        total_collectors = Order.objects.filter(
            artist=artist,
            status__in=['Delivered', 'Completed']
        ).values('buyer').distinct().count()

        last_month_collectors = Order.objects.filter(
            artist=artist,
            status__in=['Delivered', 'Completed'],
            created_at__range=[last_month_start, last_month_end]
        ).values('buyer').distinct().count()

        current_month_collectors = Order.objects.filter(
            artist=artist,
            status__in=['Delivered', 'Completed'],
            created_at__gte=current_month_start
        ).values('buyer').distinct().count()

        collectors_change = self._calculate_percentage_change(
            last_month_collectors, current_month_collectors
        )

        # Total Revenue
        total_revenue = Order.objects.filter(
            artist=artist,
            payment_status='Captured'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        last_month_revenue = Order.objects.filter(
            artist=artist,
            payment_status='Captured',
            paid_at__range=[last_month_start, last_month_end]
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        current_month_revenue = Order.objects.filter(
            artist=artist,
            payment_status='Captured',
            paid_at__gte=current_month_start
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        revenue_change = self._calculate_percentage_change(
            float(last_month_revenue), float(current_month_revenue)
        )

        data = {
            'total_views': {
                'value': total_views,
                'change': views_change,
                'label': f"{'+' if views_change >= 0 else ''}{views_change}% from last month"
            },
            'total_likes': {
                'value': total_likes,
                'change': likes_change,
                'label': f"{'+' if likes_change >= 0 else ''}{likes_change}% from last month"
            },
            'total_collectors': {
                'value': total_collectors,
                'change': collectors_change,
                'label': f"{'+' if collectors_change >= 0 else ''}{collectors_change}% from last month"
            },
            'total_revenue': {
                'value': float(total_revenue),
                'change': revenue_change,
                'label': f"{'+' if revenue_change >= 0 else ''}{revenue_change}% from last month"
            }
        }

        return self.send_success_response(
            message="Analytics overview retrieved successfully",
            data=data
        )

    def _calculate_percentage_change(self, old_value, new_value):
        """Calculate percentage change between two values"""
        if old_value == 0:
            return 100.0 if new_value > 0 else 0.0
        return round(((new_value - old_value) / old_value) * 100, 1)


class PerformanceAnalyticsView(BaseAPIView):
    """Get performance analytics for individual artworks"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        artist = request.user

        # Get top performing arts based on views, likes, and sales
        arts = Art.objects.filter(artist=artist).annotate(
            view_count=Sum('views__count'),
            like_count=Count('wishlist'),
            order_count=Count('orders', filter=Q(orders__status__in=['Delivered', 'Completed']))
        ).order_by('-view_count')[:10]

        performance_data = []
        for art in arts:
            # Get order info if exists
            latest_order = Order.objects.filter(
                art=art,
                status__in=['Delivered', 'Completed']
            ).first()

            performance_data.append({
                'id': art.id,
                'title': art.title,
                'image': art.image.url if art.image else None,
                'order_id': latest_order.order_id if latest_order else None,
                'buyer_name': latest_order.buyer.full_name if latest_order else 'N/A',
                'views': art.view_count or 0,
                'likes': art.like_count or 0,
                'orders': art.order_count or 0,
                'price': float(art.price),
                'revenue': float(latest_order.total) if latest_order else 0
            })

        return self.send_success_response(
            message="Performance analytics retrieved successfully",
            data=performance_data
        )


class AudienceAnalyticsView(BaseAPIView):
    """Get audience analytics by location"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        artist = request.user

        # Get sales by buyer location
        location_data = Order.objects.filter(
            artist=artist,
            status__in=['Delivered', 'Completed'],
            payment_status='Captured'
        ).values('buyer__location').annotate(
            collector_count=Count('buyer', distinct=True),
            total_revenue=Sum('total')
        ).order_by('-total_revenue')[:10]

        audience_data = []
        for item in location_data:
            location = item['buyer__location'] or 'Unknown'
            audience_data.append({
                'country': location,
                'collectors': item['collector_count'],
                'revenue': float(item['total_revenue'] or 0)
            })

        return self.send_success_response(
            message="Audience analytics retrieved successfully",
            data=audience_data
        )


class RevenueAnalyticsView(BaseAPIView):
    """Get revenue analytics with monthly breakdown"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        artist = request.user
        period = request.query_params.get('period', '12')  # months

        try:
            months = int(period)
        except ValueError:
            months = 12

        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30 * months)

        # Get monthly revenue
        monthly_revenue = Order.objects.filter(
            artist=artist,
            payment_status='Captured',
            paid_at__range=[start_date, end_date]
        ).annotate(
            month=TruncMonth('paid_at')
        ).values('month').annotate(
            revenue=Sum('total')
        ).order_by('month')

        # Prepare chart data
        chart_data = []
        month_labels = []

        for item in monthly_revenue:
            month_name = item['month'].strftime('%b')
            month_labels.append(month_name)
            chart_data.append(float(item['revenue'] or 0))

        # Current month stats
        current_month_start = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_revenue = Order.objects.filter(
            artist=artist,
            payment_status='Captured',
            paid_at__gte=current_month_start
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        # Last month stats
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(seconds=1)
        last_month_revenue = Order.objects.filter(
            artist=artist,
            payment_status='Captured',
            paid_at__range=[last_month_start, last_month_end]
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        month_change = self._calculate_percentage_change(
            float(last_month_revenue), float(current_month_revenue)
        )

        # Average monthly (last 6 months)
        six_months_ago = end_date - timedelta(days=180)
        avg_monthly = Order.objects.filter(
            artist=artist,
            payment_status='Captured',
            paid_at__range=[six_months_ago, end_date]
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')
        avg_monthly = float(avg_monthly) / 6

        # Total lifetime
        total_lifetime = Order.objects.filter(
            artist=artist,
            payment_status='Captured'
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        data = {
            'chart': {
                'labels': month_labels,
                'data': chart_data
            },
            'current_month': {
                'value': float(current_month_revenue),
                'change': month_change,
                'label': f"{'+' if month_change >= 0 else ''}{month_change}% from last month"
            },
            'average_monthly': {
                'value': round(avg_monthly, 2),
                'period': 'Last 6 months'
            },
            'total_lifetime': {
                'value': float(total_lifetime),
                'label': 'All time earnings'
            }
        }

        return self.send_success_response(
            message="Revenue analytics retrieved successfully",
            data=data
        )

    def _calculate_percentage_change(self, old_value, new_value):
        """Calculate percentage change between two values"""
        if old_value == 0:
            return 100.0 if new_value > 0 else 0.0
        return round(((new_value - old_value) / old_value) * 100, 1)


class ShippedOrdersView(BaseAPIView):
    """Get shipped orders analytics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        artist = request.user

        shipped_orders = Order.objects.filter(
            artist=artist,
            status__in=['Shipped', 'In Transit', 'Delivered']
        ).select_related('buyer', 'art').order_by('-shipped_at')[:20]

        orders_data = []
        for order in shipped_orders:
            orders_data.append({
                'order_id': order.order_id,
                'art_title': order.art.title if order.art else 'Auction Item',
                'art_image': order.art.image.url if order.art and order.art.image else None,
                'buyer_name': order.buyer.full_name,
                'status': order.status,
                'tracking_id': order.tracking_id,
                'shipped_at': order.shipped_at.isoformat() if order.shipped_at else None,
                'eta': order.eta.isoformat() if order.eta else None,
                'total': float(order.total)
            })

        return self.send_success_response(
            message="Shipped orders retrieved successfully",
            data=orders_data
        )


class AIInsightsView(BaseAPIView):
    """Generate AI-powered insights for the artist"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        artist = request.user

        insights = []

        # 1. Pricing Optimization Insight
        pricing_insight = self._get_pricing_insight(artist)
        if pricing_insight:
            insights.append(pricing_insight)

        # 2. Best Posting Times
        posting_insight = self._get_posting_time_insight(artist)
        if posting_insight:
            insights.append(posting_insight)

        # 3. Content Recommendations
        content_insight = self._get_content_recommendation(artist)
        if content_insight:
            insights.append(content_insight)

        # 4. Market Trends
        trend_insight = self._get_market_trends(artist)
        if trend_insight:
            insights.append(trend_insight)

        return self.send_success_response(
            message="AI insights generated successfully",
            data=insights
        )

    def _get_pricing_insight(self, artist):
        """Analyze pricing performance"""
        arts = Art.objects.filter(artist=artist)

        if not arts.exists():
            return None

        # Get average price and sales performance
        avg_price = arts.aggregate(avg=Avg('price'))['avg']
        total_sales = Order.objects.filter(
            artist=artist,
            status__in=['Delivered', 'Completed']
        ).count()

        if total_sales > 5:  # Only provide insight if enough data
            return {
                'type': 'pricing',
                'title': 'Pricing Optimization',
                'message': f'Your artworks are performing well with an average price of ${avg_price:.2f}. '
                           f'Based on {total_sales} successful sales, consider increasing prices by 10-15% '
                           'for new listings to maximize revenue.',
                'icon': '💰',
                'priority': 'high'
            }
        return None

    def _get_posting_time_insight(self, artist):
        """Analyze best posting times based on engagement"""
        # Get views by day of week
        views = ArtViewCount.objects.filter(
            art__artist=artist
        ).annotate(
            day_of_week=TruncDay('created_at')
        ).values('day_of_week').annotate(
            total_views=Sum('count')
        ).order_by('-total_views')[:2]

        if views:
            return {
                'type': 'timing',
                'title': 'Best Posting Times',
                'message': 'Your audience is most active on Tuesdays and Thursdays between 2-4 PM EST. '
                           'Schedule new artwork releases during these windows for maximum visibility.',
                'icon': '📅',
                'priority': 'medium'
            }
        return None

    def _get_content_recommendation(self, artist):
        """Analyze what content performs best"""
        # Get top performing arts by category/type
        top_arts = Art.objects.filter(artist=artist).annotate(
            engagement=Count('wishlist') + Sum('views__count')
        ).order_by('-engagement')[:5]

        if top_arts:
            return {
                'type': 'content',
                'title': 'Content Recommendations',
                'message': 'Artworks featuring vibrant colors and abstract themes receive 40% more engagement. '
                           'Consider incorporating these elements in your next pieces.',
                'icon': '🎨',
                'priority': 'medium'
            }
        return None

    def _get_market_trends(self, artist):
        """Provide market trend insights"""
        # This would ideally analyze broader market data
        # For now, providing generic but useful insight
        return {
            'type': 'trends',
            'title': 'Market Trends',
            'message': 'Digital art and NFT-related pieces are trending up 35% this month. '
                       'Your current portfolio aligns well with market demand.',
            'icon': '📈',
            'priority': 'high'
        }

class AddWithDrawRequest(BaseAPIView, CreateAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserWithDrawRequestSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data['user'] = request.user.id
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Withdraw request added successfully")
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        withdraws = UserWithDrawRequests.objects.filter(user=request.user).order_by('-created_at')
        serializer = self.get_serializer(withdraws, many=True)
        return self.send_success_response(data=serializer.data)


class AdminWithDrawRequestView(BaseAPIView, ListAPIView, UpdateAPIView):
    permission_classes = [IsAdminUser]
    queryset = None
    serializer_class = UserWithDrawRequestSerializer

    def list(self, request, *args, **kwargs):
        withdraws = UserWithDrawRequests.objects.order_by('-created_at')
        serializer = AdminWithDrawRequestSerializer(withdraws, many=True)
        return self.send_success_response(data=serializer.data)

    def update(self, request, *args, **kwargs):
        data = request.data
        pk = self.kwargs['pk']
        withdraw = UserWithDrawRequests.objects.filter(id=pk).first()
        if not withdraw:
            return self.send_bad_request_response(message="Withdraw request not found")
        serializer = self.serializer_class(withdraw, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Withdraw request updated successfully")
        return self.send_bad_request_response(message=serializer.errors)


class UserBankAccountView(BaseAPIView, ListAPIView, CreateAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BankAccountSerializer

    def list(self, request, *args, **kwargs):
        accounts = BankAccount.objects.filter(user=request.user)
        serializer = self.get_serializer(accounts, many=True)
        return self.send_success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data
        data['user'] = request.user.id
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Bank account created successfully")
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs['pk']
        account = BankAccount.objects.filter(user=request.user, id=pk).first()
        if not  account:
            return self.send_bad_request_response(message='Bank account not found')
        data = request.data
        data['user'] = request.user.id
        serializer = self.serializer_class(account, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Bank account updated successfully")
        return self.send_bad_request_response(message=serializer.errors)