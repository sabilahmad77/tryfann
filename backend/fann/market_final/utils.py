import uuid
from fann.users.models import User
import random
import string
from fann.market_final.models import Redemption
from django.db.models import IntegerField
from django.db.models.functions import Cast
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


def encode_user_id(user_id: int) -> str:
    return f"TF{user_id}X"


def generate_referral_code(user: User) -> str:
    encoded_id = encode_user_id(user.id)

    while True:
        random_code = uuid.uuid4().hex[:8].upper()
        final_code = f"{encoded_id}-{random_code}"

        if not User.objects.filter(referral_code=final_code).exists():
            return final_code


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def generate_redeem_referral_code(user):
    while True:
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if not Redemption.objects.filter(code=code).exists():
            return code


def get_user_leaderboard_rank(user, filter_by=None):
    roles = ["Artist", "Gallery", "Collector", "Ambassador", "Investor"]
    qs = User.objects.filter(role__in=roles).annotate(
        points_int=Cast("points", IntegerField())
    )
    now = timezone.now()
    if filter_by == "month":
        qs = qs.filter(created_at__year=now.year, created_at__month=now.month)

    elif filter_by == "week":
        qs = qs.filter(
            created_at__week=now.isocalendar().week, created_at__year=now.year
        )

    qs = qs.order_by("-points_int")
    total_count = qs.count()

    rank = None
    if user.is_authenticated:
        ranked_users = list(qs.values_list("id", flat=True))
        if user.id in ranked_users:
            rank = ranked_users.index(user.id) + 1
    return {"rank": rank, "out_of": total_count}
