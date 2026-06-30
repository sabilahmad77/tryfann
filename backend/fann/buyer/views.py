from collections import defaultdict
from datetime import timedelta

from django.db.models import Q, Count, Avg
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Sum, Case, When, Value, DecimalField, ExpressionWrapper
from decimal import Decimal
from django.db.models.functions import Coalesce, Cast, TruncWeek
from fann.market_final.pagination import CustomPageNumberPagination
from fann.artist.models import (
    Auction,
    AuctionBid,
    Art,
    ArtOwner,
    ArtComment,
    ArtReviews,
    ArtWishList,
    ArtViewCount,
    Order,
    OrderDispute,
    DisputeDocuments,
    DisputeConversation,
    DisputeMessage,
    Payout,
    Event, BuyerOffers,
)
from fann.artist.serializers import AuctionListSerializer, EventSerializer
from fann.buyer.models import BuyerAddress, UserPost, PaymentMethods
from fann.buyer.serializers import (
    BuyerAuctionSerializer,
    BuyerPlaceBidSerializer,
    BuyerArtSerializer,
    BuyArtSerializer,
    ArtCommentSerializer,
    ArtReviewsSerializer,
    AuctionDetailsSerializer,
    AuctionBidSerializer,
    BuyerCollectionSerializer,
    BuyerOrderSerializer,
    BuyerAddressSerializer,
    BuyerPostSerializer,
    BuyerDisputeListingSerializer,
    DisputeMessageReadSerializer,
    DisputeMessageCreateSerializer,
    PaymentMethodsSerializer,
    BuyerEventListingSerializer,
    BuyerRsvpSerializer,
    BuyerOfferCreateSerializer,
)
from fann.buyer.utils import trending_queryset, for_you_queryset
from fann.common.paginations import CustomPagination
from fann.common.response_mixins import BaseAPIView
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveAPIView,
    UpdateAPIView,
    DestroyAPIView,
)

from fann.users.models import User


class BuyerAuctionView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Auction.objects.all()
    serializer_class = BuyerAuctionSerializer

    def list(self, request, *args, **kwargs):
        auctions = Auction.objects.filter(status__in=["Upcoming", "Live"]).order_by(
            "-created_at"
        )
        serializer = self.serializer_class(auctions, many=True)
        return self.send_success_response(data=serializer.data)


class BuyerPlaceBidView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = AuctionBid.objects.all()
    serializer_class = BuyerPlaceBidSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["bidder"] = request.user.id
        data["status"] = "active"
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Bid Placed successfully")
        return self.send_bad_request_response(message=serializer.errors)


class BuyerActiveArtsView(BaseAPIView, ListAPIView, RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Art.objects.all()
    serializer_class = BuyerArtSerializer

    def list(self, request, *args, **kwargs):
        category = request.GET.get("category", "All")
        art = Art.objects.filter(is_sold=False).order_by("-created_at")
        search = request.GET.get("search", "")
        min_price = request.GET.get("min_price", None)
        max_price = request.GET.get("max_price", None)
        sort_by = request.GET.get("sort_by", "price")
        if category == "All":
            art = art
        elif category == "For_You":
            art = for_you_queryset(request.user)
        elif category == "Trending":
            art = trending_queryset()
        elif category == "New":
            art = art.order_by("-created_at")
        if min_price:
            art = art.filter(price__gte=min_price)
        if max_price:
            art = art.filter(price__lte=max_price)

        if search:
            art = art.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
                | Q(art_tags__icontains=search)
            )
        if request.GET.get("page"):
            # paginator = CustomPageNumberPagination()
            # paginator.page_size = request.GET.get("per_page")
            # paginator.page = request.GET.get("page")
            # query_set = paginator.paginate_queryset(art, request)
            paginator = CustomPageNumberPagination()
            page = paginator.paginate_queryset(art, request)
            serializer = self.serializer_class(
                page, many=True, context={"request": request}
            )
            return paginator.get_paginated_response(serializer.data)
            # if paginator.page.paginator.num_pages == int(request.GET.get("page")):
            #     return paginator.get_last_page_data(serializer.data)
            # else:
            #     return paginator.get_paginated_response(serializer.data)
        serializer = self.serializer_class(art, many=True, context={"request": request})
        return self.send_success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        art = Art.objects.filter(id=pk).first()
        if not art:
            return self.send_bad_request_response(message="Art not found")
        serializer = self.serializer_class(art, context={"request": request})
        return self.send_success_response(data=serializer.data)


class ArtDetailView(BaseAPIView, RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Art.objects.all()
    serializer_class = BuyerArtSerializer

    def add_views(self, art):
        owner = ArtOwner.objects.filter(art_id=art.id, owner=self.request.user).first()
        if owner:
            return
        review_count = ArtViewCount.objects.filter(art_id=art.id).first()
        if review_count:
            review_count.count += 1
            review_count.save()
        else:
            ArtViewCount.objects.create(art_id=art.id)

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        art = Art.objects.filter(id=pk).first()
        if not art:
            return self.send_bad_request_response(message="Art not found")
        self.add_views(art)
        serializer = self.serializer_class(art, context={"request": request})
        return self.send_success_response(data=serializer.data)


class BuyArtView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyArtSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = request.user
        serializer = self.serializer_class(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Art purchased successfully")
        return self.send_bad_request_response(message=serializer.errors)


class BuyerCommentView(BaseAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ArtComment.objects.all()
    serializer_class = ArtCommentSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = request.user.id
        serializer = self.serializer_class(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Comment added successfully")
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = kwargs["pk"]
        comment = ArtComment.objects.filter(pk=pk).first()
        if not comment:
            return self.send_bad_request_response(message="Art comment not found")
        data = request.data
        data["user"] = request.user.id
        serializer = self.serializer_class(
            comment, data=data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Comment updated successfully")
        return self.send_bad_request_response(message=serializer.errors)

    def destroy(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        comment = ArtComment.objects.filter(pk=pk).first()
        if not comment:
            return self.send_bad_request_response(message="Art comment not found")
        comment.delete()
        return self.send_success_response(message="Comment deleted successfully")


class BuyerArtReviewView(
    BaseAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView, ListAPIView
):
    permission_classes = [IsAuthenticated]
    queryset = ArtReviews.objects.all()
    serializer_class = ArtReviewsSerializer

    def list(self, request, *args, **kwargs):
        art = request.GET.get("art", None)
        reviews = ArtReviews.objects.filter(art_id=art)
        serializer = self.serializer_class(reviews, many=True)
        return self.send_success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = request.user.id
        serializer = self.serializer_class(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Review added successfully")
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        review = ArtReviews.objects.filter(pk=pk).first()
        if not review:
            return self.send_bad_request_response(message="Art review not found")
        data = request.data
        data["user"] = request.user.id
        serializer = self.serializer_class(
            review, data=data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Review updated successfully")
        return self.send_bad_request_response(message=serializer.errors)

    def destroy(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        review = ArtReviews.objects.filter(pk=pk).first()
        if not review:
            return self.send_bad_request_response(message="Art review not found")
        review.delete()
        return self.send_success_response(message="Review deleted successfully")


class AuctionRetrieveView(BaseAPIView, RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Auction.objects.all()
    serializer_class = AuctionDetailsSerializer

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        auction = Auction.objects.filter(pk=pk).first()
        if not auction:
            return self.send_bad_request_response(message="Auction not found")
        serializer = self.serializer_class(auction, context={"request": request})
        return self.send_success_response(data=serializer.data)


class AuctionBidView(BaseAPIView, RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = AuctionBid.objects.all()
    serializer_class = AuctionBidSerializer

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        bids = AuctionBid.objects.filter(auction__id=pk).order_by("-amount")
        serializer = self.serializer_class(
            bids, context={"request": request}, many=True
        )
        return self.send_success_response(data=serializer.data)


class AuctionBuyerView(BaseAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Auction.objects.all()
    serializer_class = None

    def list(self, request, *args, **kwargs):
        artist = request.GET.get("artist", None)
        auction_status = request.GET.get("status", None)
        search = request.GET.get("search", None)
        query = Auction.objects.filter().order_by("start_time")
        if auction_status == "All":
            query = query
        if auction_status == "Live":
            query = query.filter(status="Live")
        if auction_status == "Upcoming":
            query = query.filter(status="Upcoming")
        if auction_status == "Ended":
            query = query.filter(status="Ended")
        if artist:
            query = query.filter(artist__id=artist)
        if search:
            query = query.filter(
                Q(art__title__icontains=search) | Q(art__art_tags__in=search)
            )
        serializer = AuctionListSerializer(query, many=True)
        return self.send_success_response(data=serializer.data)


class PurchasedArtView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerCollectionSerializer

    def list(self, request, *args, **kwargs):
        art_type = request.GET.get("art_type", None)
        search = request.GET.get("search", "")
        # min_price = request.GET.get("min_price", 0)
        # max_price = request.GET.get("max_price", 100)
        sort_by = request.GET.get("sort_by", "price")
        if not art_type:
            return self.send_bad_request_response(message="Art type required")
        owners = (
            ArtOwner.objects.filter(owner=request.user)
            .values_list("art__id", flat=True)
            .distinct()
        )
        art = Art.objects.filter(id__in=owners, art_type__iexact=art_type)
        # if min_price:
        #     art = art.filter(price__gte=min_price)
        # if max_price:
        #     art = art.filter(price__lte=max_price)

        sort_map = {
            "price": "-price",
            "created_at": "-created_at",
        }
        sort_field = sort_map.get(sort_by, "price")
        art = art.order_by(sort_field)
        if search:
            art = art.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(location__icontains=search)
                | Q(art_tags__icontains=search)
            )
        serializer = self.serializer_class(art, many=True, context={"request": request})
        return self.send_success_response(data=serializer.data)


class CollectionArtViewsCountView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerCollectionSerializer

    def list(self, request, *args, **kwargs):
        owners = (
            ArtOwner.objects.filter(owner=request.user)
            .values_list("art__id", flat=True)
            .distinct()
        )
        arts = Art.objects.filter(id__in=owners)
        views_count = []
        for art in arts:
            views = ArtViewCount.objects.filter(art=art).first()
            views_count.append(
                {
                    "art": art.title,
                    "count": views.count if views else 0,
                }
            )
        return self.send_success_response(data=views_count)


class BuyerArtCollectionStats(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        # rows for this user
        base_qs = (
            ArtOwner.objects.filter(owner=request.user)
            .select_related("art")
            .annotate(
                eff_price=Coalesce(
                    Case(
                        When(art__discount_price__gt=0, then=F("art__discount_price")),
                        default=F("art__price"),
                        output_field=DecimalField(max_digits=20, decimal_places=2),
                    ),
                    Value(
                        0, output_field=DecimalField(max_digits=20, decimal_places=2)
                    ),
                ),
                frac_ratio=Case(
                    When(
                        art__art_type="Fractional",
                        then=ExpressionWrapper(
                            Cast(
                                F("factions"),
                                DecimalField(max_digits=30, decimal_places=10),
                            )
                            / Cast(
                                F("art__no_of_fraction"),
                                DecimalField(max_digits=30, decimal_places=10),
                            ),
                            output_field=DecimalField(max_digits=30, decimal_places=10),
                        ),
                    ),
                    default=Value(
                        Decimal("1.0"),
                        output_field=DecimalField(max_digits=30, decimal_places=10),
                    ),
                    output_field=DecimalField(max_digits=30, decimal_places=10),
                ),
            )
            .annotate(
                row_investment=ExpressionWrapper(
                    F("eff_price") * F("frac_ratio"),
                    output_field=DecimalField(max_digits=20, decimal_places=2),
                )
            )
        )

        # money totals
        totals = base_qs.aggregate(
            total_single=Coalesce(
                Sum(
                    Case(
                        When(art__art_type="Single", then=F("eff_price")),
                        default=Value(0),
                        output_field=DecimalField(max_digits=20, decimal_places=2),
                    )
                ),
                Value(0, output_field=DecimalField(max_digits=20, decimal_places=2)),
            ),
            total_fractional=Coalesce(
                Sum(
                    Case(
                        When(art__art_type="Fractional", then=F("row_investment")),
                        default=Value(0),
                        output_field=DecimalField(max_digits=20, decimal_places=2),
                    )
                ),
                Value(0, output_field=DecimalField(max_digits=20, decimal_places=2)),
            ),
        )
        totals["grand_total"] = (totals["total_single"] or Decimal("0")) + (
            totals["total_fractional"] or Decimal("0")
        )

        # distinct item counts (by art), per type
        counts = ArtOwner.objects.filter(owner=request.user).aggregate(
            item_count_single=Count(
                "art", filter=Q(art__art_type="Single"), distinct=True
            ),
            item_count_fractional=Count(
                "art", filter=Q(art__art_type="Fractional"), distinct=True
            ),
        )
        counts["item_count_total"] = (counts["item_count_single"] or 0) + (
            counts["item_count_fractional"] or 0
        )
        response = {
            "item_count_total": counts["item_count_total"],
            "total_investment": totals["grand_total"],
        }
        return self.send_success_response(data=response)


class AddWishListView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        data = request.data
        wishlist = ArtWishList.objects.filter(
            art_id=data.get("art"), user=self.request.user
        ).first()
        if wishlist:
            wishlist.delete()
            return self.send_success_response(message="Removed from wishlist")
        else:
            ArtWishList.objects.create(art_id=data.get("art"), user=self.request.user)
            return self.send_success_response(message="Added wishlist")


class BuyerOrdersView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerOrderSerializer

    def list(self, request, *args, **kwargs):
        orders = Order.objects.filter(buyer=self.request.user).order_by("-created_at")
        serializer = self.serializer_class(orders, many=True)
        return self.send_success_response(data=serializer.data)


class OrderStatsView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        user = request.user
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Paid this month: captured and paid/created in this month
        this_month_q = Q(payment_status="Captured") & (
            Q(paid_at__gte=month_start)
            | (Q(paid_at__isnull=True) & Q(created_at__gte=month_start))
        )

        # Pending spending = orders currently "In Transit"
        # If you want only paid-but-not-delivered, use: Q(status="In Transit") & Q(payment_status="Captured")
        pending_q = Q(status="In Transit")

        qs = Order.objects.filter(buyer=user)

        dec_field = DecimalField(max_digits=20, decimal_places=2)

        agg = qs.aggregate(
            total_lifetime_spending=Coalesce(
                Sum("total", filter=Q(payment_status="Captured")),
                Value(Decimal("0.00")),
                output_field=dec_field,
            ),
            this_month_spending=Coalesce(
                Sum("total", filter=this_month_q),
                Value(Decimal("0.00")),
                output_field=dec_field,
            ),
            pending_spending=Coalesce(
                Sum("total", filter=pending_q),
                Value(Decimal("0.00")),
                output_field=dec_field,
            ),
            average_spending_price=Coalesce(
                Avg("total", filter=Q(payment_status="Captured")),
                Value(Decimal("0.00")),
                output_field=dec_field,
            ),
        )

        response = {
            "total_lifetime_spending": round(agg["total_lifetime_spending"], 2),
            "this_month_spending": round(agg["this_month_spending"], 2),
            "pending_spending": round(agg["pending_spending"], 2),
            "average_spending_price": round(agg["average_spending_price"], 2),
            "as_of": now.isoformat(),
        }
        return self.send_success_response(data=response)


class BuyerAddressView(BaseAPIView, UpdateAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerAddressSerializer

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
        data = request.data
        data["user"] = self.request.user.id
        address = BuyerAddress.objects.filter(id=pk, user=request.user).first()
        if not address:
            return self.send_bad_request_response(message="Buyer address not found")
        serializer = self.serializer_class(address, data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        address = BuyerAddress.objects.filter(user=request.user).order_by("-created_at")
        if not address:
            return self.send_bad_request_response(message="Buyer address not found")
        serializer = self.serializer_class(address, many=True)
        return self.send_success_response(data=serializer.data)


class BuyerPostView(BaseAPIView, UpdateAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerPostSerializer

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
        data = request.data
        data["user"] = self.request.user.id
        post = UserPost.objects.filter(id=pk, user=request.user).first()
        if not post:
            return self.send_bad_request_response(message="Buyer post not found")
        serializer = self.serializer_class(post, data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        post = UserPost.objects.filter(user=request.user)
        if not post:
            return self.send_bad_request_response(message="Buyer post not found")
        serializer = self.serializer_class(post, many=True)
        return self.send_success_response(data=serializer.data)


class BuyerPostStatsView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        now = timezone.now()
        # ISO week starts on Monday (1..7). Get Monday 00:00 of the current week.
        start_of_week = (now - timedelta(days=now.isoweekday() - 1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        total_posts = UserPost.objects.count()
        total_unique_users = UserPost.objects.values("user").distinct().count()
        this_week_posts = UserPost.objects.filter(created_at__gte=start_of_week).count()

        response = {
            "total_unique_users": total_unique_users,
            "total_posts": total_posts,
            "this_week_posts": this_week_posts,
        }
        return self.send_success_response(data=response)


class MarkOrderCompleted(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def update(self, request, *args, **kwargs):
        data = request.data
        order = Order.objects.filter(buyer=request.user, id=data["order"]).first()
        if not order:
            return self.send_bad_request_response(message="Order not found")
        if not order.status == "Delivered":
            return self.send_bad_request_response(message="order not delivered yet")
        order.status = "Completed"
        order.paid_at = timezone.now()
        order.save()
        payout = Payout.objects.filter(order=order).first()
        if payout:
            payout.status = "Paid"
            payout.paid_at = timezone.now()
            payout.save()
        return self.send_success_response(message="Order completed successfully")


class FileDisputeView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        data = request.data
        documents = request.FILES.getlist("documents")
        order = Order.objects.filter(buyer=request.user, id=data["order"]).first()
        if not order:
            return self.send_bad_request_response(message="Order not found")
        if order.status != "Delivered":
            return self.send_bad_request_response(message="order not delivered yet")
        order.status = "Disputed"
        order.save()
        dispute = OrderDispute.objects.create(
            order=order,
            buyer=request.user,
            seller=order.artist,
            title=data["title"],
            description=data["description"],
        )
        for user in [dispute.buyer, dispute.seller]:
            conv, _ = DisputeConversation.objects.get_or_create(
                dispute_id=dispute.id,
                party=user,
                party_role=user.role,
            )
            msg = DisputeMessage.objects.create(
                conversation=conv,
                sender=user,
                message=data["description"],
            )
        for document in documents:
            DisputeDocuments.objects.create(
                file=document,
                dispute=dispute,
            )
        return self.send_success_response(message="Order disputed successfully")


class OrderDisputeView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerDisputeListingSerializer

    def list(self, request, *args, **kwargs):
        dispute = []
        if self.request.user.role == "Customer":
            dispute = OrderDispute.objects.filter(buyer=request.user).order_by(
                "-created_at"
            )
        elif self.request.user.role == "Artist":
            dispute = OrderDispute.objects.filter(seller=request.user).order_by(
                "-created_at"
            )
        if not dispute:
            return self.send_bad_request_response(message="Dispute not found")
        serializer = self.serializer_class(dispute, many=True)
        return self.send_success_response(data=serializer.data)


class AdminOrderDispute(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerDisputeListingSerializer

    def list(self, request, *args, **kwargs):
        dispute = OrderDispute.objects.filter().order_by("-created_at")
        serializer = self.serializer_class(dispute, many=True)
        return self.send_success_response(data=serializer.data)


class DisputeDecisionView(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def update(self, request, *args, **kwargs):
        data = request.data
        dispute = OrderDispute.objects.filter(id=data["id"]).first()
        if not dispute:
            return self.send_bad_request_response(message="Dispute not found")
        if dispute.status != "FILED":
            return self.send_bad_request_response(message=f"Dispute Already Resolved")
        dispute.status = data["status"]
        dispute.save()
        return self.send_success_response(
            message=f"Dispute Decision updated successfully"
        )


def infer_party_role(user):
    return "BUYER" if getattr(user, "role", "") == "Customer" else "SELLER"


class PartyChatList(BaseAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        user = request.user
        role = user.role
        dispute_id = request.GET.get("dispute_id")
        conv = DisputeConversation.objects.filter(
            dispute_id=dispute_id, party=user, party_role=role
        ).first()
        if not conv:
            return self.send_bad_request_response(message="No conversation found")

        msgs = (
            DisputeMessage.objects.filter(conversation=conv)
            .select_related("sender")
            .order_by("created_at")
        )
        data = DisputeMessageReadSerializer(msgs, many=True).data
        return self.send_success_response(data=data)

    def create(self, request, *args, **kwargs):
        user = request.user
        role = user.role
        data = request.data
        dispute_id = data.get("dispute_id")
        conv, _ = DisputeConversation.objects.get_or_create(
            dispute_id=dispute_id,
            party=user,
            party_role=role,
        )
        msg = DisputeMessage.objects.create(
            conversation=conv,
            sender=user,
            message=data["message"],
        )

        # touch last_message_at
        DisputeConversation.objects.filter(pk=conv.pk).update(
            last_message_at=msg.created_at
        )
        data = DisputeMessageReadSerializer(msg).data
        return self.send_success_response(data=data)


class AdminChatList(BaseAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        if not request.user.role == "SuperAdmin":
            return self.send_bad_request_response(message="Only SuperAdmin can list")

        party_id = request.GET.get("party_id")
        dispute_id = request.GET.get("dispute_id")
        party = User.objects.filter(id=party_id).first()
        if not party:
            return self.send_bad_request_response(message="Party not found")
        role = party.role
        conv = DisputeConversation.objects.filter(
            dispute_id=dispute_id, party_id=party_id, party_role=role
        ).first()
        if not conv:
            return self.send_bad_request_response(message="No conversation found")

        msgs = (
            DisputeMessage.objects.filter(conversation=conv)
            .select_related("sender")
            .order_by("created_at")
        )
        data = DisputeMessageReadSerializer(msgs, many=True).data
        return self.send_success_response(data=data)

    def create(self, request, *args, **kwargs):
        if not request.user.role == "SuperAdmin":
            return self.send_bad_request_response(message="Only SuperAdmin can list")
        data = request.data
        party_id = request.data.get("party_id")
        user = User.objects.filter(id=party_id).first()
        if not user:
            return self.send_bad_request_response(message="No user found")
        role = user.role
        dispute_id = request.data.get("dispute_id")

        conv, _ = DisputeConversation.objects.get_or_create(
            dispute_id=dispute_id,
            party_id=party_id,
            party_role=role,
            defaults={"admin": request.user},
        )
        msg = DisputeMessage.objects.create(
            conversation=conv,
            sender=request.user,
            message=data["message"],
        )

        DisputeConversation.objects.filter(pk=conv.pk).update(
            last_message_at=msg.created_at
        )
        data = DisputeMessageReadSerializer(msg).data
        return self.send_success_response(data=data)


class PaymentMethodView(
    BaseAPIView, ListAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = PaymentMethodsSerializer

    def list(self, request, *args, **kwargs):
        methods = PaymentMethods.objects.filter(user=self.request.user)
        serializer = self.get_serializer(methods, many=True)
        return self.send_success_response(data=serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = self.request.user.id
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        payment_method = PaymentMethods.objects.filter(pk=pk).first()
        if not payment_method:
            return self.send_bad_request_response(message="Payment method not found")
        serializer = self.get_serializer(
            payment_method, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def destroy(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        payment_method = PaymentMethods.objects.filter(pk=pk).first()
        if not payment_method:
            return self.send_bad_request_response(message="Payment method not found")
        payment_method.delete()
        return self.send_success_response(message="Payment method deleted")


class BuyerEventListing(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerEventListingSerializer

    def list(self, request, *args, **kwargs):
        events = Event.objects.filter(status__in=["Upcoming", "Live"])
        serializer = self.get_serializer(events, many=True)
        return self.send_success_response(data=serializer.data)


class BuyerRSVPView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerRsvpSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["user"] = self.request.user.id
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class PlaceOfferAPI(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerOfferCreateSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["buyer"] = request.user.id
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Offer Placed Successfully")
        return self.send_bad_request_response(message=serializer.errors)

class BuyerOfferListing(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = BuyerOfferCreateSerializer

    def list(self, request, *args, **kwargs):
        art_id = kwargs.get("pk")
        offers = BuyerOffers.objects.filter(art_id=art_id, buyer=request.user).order_by("-created_at").first()
        serializer = self.get_serializer(offers)
        return self.send_success_response(data=serializer.data)

class BuyerPostGetView(BaseAPIView, ListAPIView):
    permission_classes = []
    queryset = None
    serializer_class = BuyerPostSerializer

    def list(self, request, *args, **kwargs):
        post = UserPost.objects.all()
        serializer = self.serializer_class(post, many=True)
        return self.send_success_response(data=serializer.data)
