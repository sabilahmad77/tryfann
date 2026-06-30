from datetime import timedelta
from django.db.models import (
    Q,
    F,
    Count,
    Avg,
    Sum,
    Case,
    When,
    Value,
    IntegerField,
    FloatField,
    ExpressionWrapper,
)
from django.db.models.functions import Coalesce
from django.utils import timezone

from fann.artist.models import (
    Art,
    ArtWishList,
    ArtShare,
    ArtViewCount,
    ArtReviews,
    ArtComment,
    ArtistFollow,
)


W_WISHLIST = 3.0
W_SHARE = 2.5
W_VIEW = 1.2
W_REVIEW = 2.0
W_COMMENT = 1.0

W_FOLLOWED_ARTIST = 2.0
W_TAG_MATCH = 1.2
TAG_MATCH_CAP = 3

RECENT_BOOSTS = [
    (3, 1.30),
    (7, 1.15),
    (30, 1.05),
]
RECENT_FALLBACK = 0.95


def _recency_boost_case(now):
    """
    Piecewise recency boost implemented with CASE WHEN for portability.
    """
    whens = []
    for days, boost in RECENT_BOOSTS:
        whens.append(
            When(created_at__gte=now - timedelta(days=days), then=Value(boost))
        )
    return Case(
        *whens,
        default=Value(RECENT_FALLBACK),
        output_field=FloatField(),
    )


def trending_queryset(days: int = 7):
    """
    Global 'Trending' queryset with weighted, recent engagement.
    """
    now = timezone.now()
    since = now - timedelta(days=days)

    qs = (
        Art.objects.filter(is_sold=False)
        .annotate(
            wl_7d=Coalesce(
                Count(
                    "wishlist", filter=Q(wishlist__created_at__gte=since), distinct=True
                ),
                0,
            ),
            sh_7d=Coalesce(
                Count(
                    "art_share", filter=Q(art_share__created__gte=since), distinct=True
                ),
                0,
            ),
            vw_7d=Coalesce(
                Sum("views__count", filter=Q(views__created_at__gte=since)), 0
            ),
            rv_cnt_7d=Coalesce(
                Count(
                    "reviews", filter=Q(reviews__created_at__gte=since), distinct=True
                ),
                0,
            ),
            rv_avg_7d=Coalesce(
                Avg("reviews__rating", filter=Q(reviews__created_at__gte=since)), 0.0
            ),
            cm_7d=Coalesce(
                Count(
                    "comments", filter=Q(comments__created_at__gte=since), distinct=True
                ),
                0,
            ),
            recent_boost=_recency_boost_case(now),
        )
        .annotate(
            review_strength=ExpressionWrapper(
                F("rv_cnt_7d") * (F("rv_avg_7d") / Value(5.0)),
                output_field=FloatField(),
            ),
        )
        .annotate(
            trending_score=(
                W_WISHLIST * CastFloat(F("wl_7d"))
                + W_SHARE * CastFloat(F("sh_7d"))
                + W_VIEW * CastFloat(F("vw_7d"))
                + W_REVIEW * F("review_strength")
                + W_COMMENT * CastFloat(F("cm_7d"))
            )
            * F("recent_boost")
        )
        .order_by("-trending_score", "-created_at")
        .select_related("artist")
    )
    return qs


def for_you_queryset(user, days: int = 7):
    """
    Personalized 'For You' = Trending + boosts for followed artists & tag overlap
    with user's recent actions (wishlist, reviews, comments) in the same window.
    """
    base = trending_queryset(days=days)

    now = timezone.now()
    since = now - timedelta(days=days)

    followed_artist_ids = ArtistFollow.objects.filter(follower=user).values_list(
        "artist_id", flat=True
    )

    user_recent_art_ids = (
        set(
            ArtWishList.objects.filter(user=user, created_at__gte=since).values_list(
                "art_id", flat=True
            )
        )
        | set(
            ArtReviews.objects.filter(user=user, created_at__gte=since).values_list(
                "art_id", flat=True
            )
        )
        | set(
            ArtComment.objects.filter(user=user, created_at__gte=since).values_list(
                "art_id", flat=True
            )
        )
    )

    user_tag_pool = []
    if user_recent_art_ids:
        for t in Art.objects.filter(id__in=user_recent_art_ids).values_list(
            "art_tags", flat=True
        ):
            if isinstance(t, list):
                user_tag_pool.extend(t)

    top_tags = list(dict.fromkeys(user_tag_pool))[:10]

    tag_overlap_q = Q()
    for tag in top_tags:
        if isinstance(tag, str) and tag.strip():
            tag_overlap_q |= Q(art_tags__icontains=tag.strip())

    qs = base

    # Follow boost
    qs = qs.annotate(
        followed_boost=Case(
            When(
                artist_id__in=list(followed_artist_ids), then=Value(W_FOLLOWED_ARTIST)
            ),
            default=Value(0.0),
            output_field=FloatField(),
        )
    )

    if tag_overlap_q:
        qs = qs.annotate(
            tag_match_bonus=Case(
                When(tag_overlap_q, then=Value(W_TAG_MATCH)),
                default=Value(0.0),
                output_field=FloatField(),
            )
        )
    else:
        qs = qs.annotate(tag_match_bonus=Value(0.0, output_field=FloatField()))

    qs = qs.annotate(explore=Value(0.0, output_field=FloatField()))

    qs = qs.annotate(
        personal_score=F("trending_score")
        + F("followed_boost")
        + F("tag_match_bonus")
        + F("explore")
    ).order_by("-personal_score", "-created_at")

    return qs


def CastFloat(expr):
    return ExpressionWrapper(Coalesce(expr, Value(0.0)), output_field=FloatField())
