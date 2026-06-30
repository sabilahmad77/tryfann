from datetime import timedelta, datetime
from decimal import Decimal
from fann.artist.faiss_algo import INDEX
from django.db import transaction
from django.db.models import Sum, Value, DecimalField, Q
from django.db.models.aggregates import Avg
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import filters
from rest_framework import viewsets
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    RetrieveAPIView,
    UpdateAPIView,
    DestroyAPIView,
    GenericAPIView,
)
from rest_framework.permissions import IsAuthenticated, AllowAny

from fann.artist.faiss_algo import FaissImageIndex
from fann.artist.models import (
    Art,
    Auction,
    ArtComment,
    AuctionBid,
    Order,
    Payout,
    ArtOwner,
    ArtistShop,
    OrderLabel,
    OrderDispute,
    ArtShare,
    ArtGallery,
    ArtistFollow,
    OrganizationChallenge,
    Event,
    BuyerOffers,
    PaymentTransaction,
    UserDiscussion,
    DiscussionView,
    UserBoard,
    UserBoardCollection,
    BuyerCounterOffers,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from fann.artist.serializers import (
    ArtSerializer,
    ArtAuctionSerializer,
    CommentsSerializer,
    AuctionBidingSerializer,
    OrderSerializer,
    AuctionCreateSerializer,
    AuctionListSerializer,
    ArtCreateFixedPriceSerializer,
    ArtCreateAuctionSerializer,
    UserDetailSerializer,
    OrganizationArtistSerializer,
    ArtistShopCreateSerializer,
    ShopListingSerializer,
    SellerOrderSerializer,
    UpdateOrderSerializer,
    ArtistDetailSerializer,
    ArtistPortFolioSerializer,
    ArtistDetailPublicSerializer,
    FollowArtistSerializer,
    ArtShareSerializer,
    ArtWithGallerySerializer,
    ArtGallerySerializer,
    PayoutSerializer,
    PrimarySalesSerializer,
    ArtSalesSerializer,
    ArtDetailSerializer,
    OrganizationChallengeCreateSerializer,
    EventSerializer,
    SellerEventListingSerializer,
    ArtOfferSerializer,
    JoinOrgChallengeSerializers,
    DiscussionSerializer,
    UserBoardSerializer,
    BoardCollectionsSerializer,
    UserBoardCollectionSerializers,
    BuyerOfferListSerializer,
    RejectOfferSerializer,
    CounterOfferSerializer,
    ArtSearchSerializer, TransactionHistorySerializer,
)
from fann.artist.utils import generateLabel
from fann.common.paginations import CustomPagination
from fann.common.permissions import IsSuperAdmin
from fann.common.response_mixins import BaseAPIView
from fann.common.permissions import IsArtistPermission
from fann.users.models import UserAccount, User, ArtistPortFolio
from django.db.models import Max
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Avg, Sum


class ArtViewSet(
    BaseAPIView,
    CreateAPIView,
    ListAPIView,
    DestroyAPIView,
    UpdateAPIView,
    RetrieveAPIView,
):
    permission_classes = [IsAuthenticated]
    serializer_class = ArtSerializer
    queryset = Art.objects.all()
    filter_backends = [filters.SearchFilter]
    parser_classes = [MultiPartParser, FormParser]
    search_fields = ["title", "art_tags"]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Use POST only (no files), avoid copying file objects
        data = request.data.copy()
        data["artist"] = request.user.id

        serializer = ArtCreateFixedPriceSerializer(
            data=data, context={"request": request}
        )  # no request in context needed
        serializer.is_valid(raise_exception=True)
        art = serializer.save()

        # Handle files separately
        gallery_files = request.FILES.getlist("gallery")
        for image in gallery_files:
            ArtGallery.objects.create(art=art, image=image)

        return self.send_success_response(message="Art created successfully")

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = Art.objects.filter(id=pk).first()
        if not art:
            return self.send_bad_request_response(message="Art not found")
        serializer = self.serializer_class(art, context={"request": request})
        return self.send_success_response(message=serializer.data)

    def list(self, request, *args, **kwargs):
        # Start with artist filter
        if self.request.user.role == "Organization":
            organization_artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
            organization_artist.append(self.request.user.id)
            artist = organization_artist
        else:
            artist = [request.user.id]
        queryset = self.queryset.filter(artist__id__in=artist)
        # Let DRF SearchFilter apply (title, art_tags)
        queryset = self.filter_queryset(queryset)

        # Manual filters
        year = request.GET.get("year")
        royalty = request.GET.get("royalty")
        price = request.GET.get("price")

        if year:
            queryset = queryset.filter(year=year)
        if royalty:
            queryset = queryset.filter(royalty=royalty)
        if price:
            queryset = queryset.filter(price=price)
        if request.GET.get("page"):
            paginator = CustomPagination()
            paginator.page_size = request.GET.get("per_page")
            paginator.page = request.GET.get("page")
            query_set = paginator.paginate_queryset(queryset, request)
            serializer = ArtSerializer(
                query_set, many=True, context={"request": request}
            )
            if paginator.page.paginator.num_pages == int(request.GET.get("page")):
                return paginator.get_last_page_data(serializer.data)
            else:
                return paginator.get_paginated_response(serializer.data)
        serializer = ArtSerializer(queryset, many=True)
        return self.send_success_response(data=serializer.data)

    def destroy(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = self.queryset.filter(pk=pk).first()
        if art and art.artist == request.user:
            art.delete()
            return self.send_success_response(message="Art deleted successfully")
        return self.send_bad_request_response(message="Art not found.")

    def update(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = self.queryset.filter(pk=pk).first()
        if not art:
            return self.send_bad_request_response(message="Art not found.")
        serializer = self.serializer_class(art, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Art updated successfully")
        return self.send_bad_request_response(message=serializer.errors)


class ArtAuctionViewSet(
    BaseAPIView,
    CreateAPIView,
    ListAPIView,
    DestroyAPIView,
    UpdateAPIView,
    RetrieveAPIView,
):
    permission_classes = [IsArtistPermission]
    serializer_class = ArtSerializer
    queryset = Art.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "art_tags"]

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data["artist"] = request.user.id
        serializer = ArtCreateAuctionSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Art created successfully")
        return self.send_bad_request_response(message=serializer.errors)


class ArtRetireveView(BaseAPIView, RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ArtWithGallerySerializer
    queryset = Art.objects.all()

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = Art.objects.filter(id=pk).first()
        if not art:
            return self.send_bad_request_response(message="Art not found")
        serializer = self.serializer_class(art, context={"request": request})
        return self.send_success_response(message=serializer.data)


class ArtAuctionView(
    BaseAPIView, CreateAPIView, ListAPIView, DestroyAPIView, UpdateAPIView
):
    permission_classes = [IsAuthenticated]
    queryset = Auction.objects.all()
    serializer_class = ArtAuctionSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["artist"] = request.user
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(
                message="Art auction started successfully"
            )
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        if self.request.user.role == "Organization":
            organization_artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
            organization_artist.append(self.request.user.id)
            artist = organization_artist
        else:
            artist = [request.user.id]
        art = self.queryset.filter(artist__id__in=artist)
        serializer = ArtAuctionSerializer(art, many=True)
        return self.send_success_response(message=serializer.data)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = self.queryset.get(pk=pk)
        if not art:
            return self.send_bad_request_response(message="Art not found.")
        serializer = self.serializer_class(art, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(message="Art updated successfully")
        return self.send_bad_request_response(message=serializer.errors)


class ArtCommentsListing(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ArtComment.objects.all()
    serializer_class = CommentsSerializer

    def list(self, request, *args, **kwargs):
        if self.request.user.role == "Organization":
            artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
        else:
            artist = [request.user.id]
        comments = ArtComment.objects.filter(art__artist_id__in=artist).order_by(
            "-created_at"
        )
        serializer = self.serializer_class(comments, many=True)
        return self.send_success_response(data=serializer.data)


class AuctionBidingView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = AuctionBid.objects.all()
    serializer_class = AuctionBidingSerializer

    def list(self, request, *args, **kwargs):
        if self.request.user.role == "Organization":
            artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
        else:
            artist = [request.user.id]
        bids = AuctionBid.objects.filter(auction__artist_id__in=artist).order_by(
            "-created_at"
        )
        serializer = self.serializer_class(bids, many=True)
        return self.send_success_response(data=serializer.data)


class ArtNewSaleView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def list(self, request, *args, **kwargs):
        if self.request.user.role == "Organization":
            artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
        else:
            artist = [request.user.id]
        orders = self.queryset.filter(artist_id__in=artist).order_by("-created_at")
        serializer = self.serializer_class(orders, many=True)
        return self.send_success_response(data=serializer.data)


class ArtistStatsView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        life_time_earnings = 0
        earnings = UserAccount.objects.filter(user=request.user).first()
        if earnings:
            life_time_earnings = earnings.available_balance
        if self.request.user.role == "Organization":
            artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
        else:
            artist = [request.user.id]
        payouts = Payout.objects.filter(artist_id__in=artist, status="Pending").count()
        active_arts = Art.objects.filter(is_active=True, artist_id__in=artist).count()
        orders_in_progress = Order.objects.filter(
            artist_id__in=artist, status="In Progress"
        ).count()

        # --- NEW: last 30 days (one month rolling) ---
        now = timezone.now()
        one_month_ago = now - timedelta(days=30)  # rolling 30 days

        monthly_qs = Order.objects.filter(
            artist_id__in=artist, status="Fulfilled", created_at__gte=one_month_ago
        )
        monthly_agg = monthly_qs.aggregate(
            total=Coalesce(
                Sum("total"),
                Value(
                    Decimal("0.00"),
                    output_field=DecimalField(max_digits=20, decimal_places=2),
                ),
            )
        )
        monthly_earnings = monthly_agg["total"]  # will be a Decimal

        # for artwork percentage
        today = now.date()
        yesterday = today - timedelta(days=1)
        today_count = Art.objects.filter(
            artist_id__in=artist, created_at__date=today
        ).count()
        yesterday_count = Art.objects.filter(
            artist_id__in=artist, created_at__date=yesterday
        ).count()
        total_counts = today_count + yesterday_count

        if total_counts == 0:
            art_percentage = 0.0
        else:
            art_percentage = (today_count / total_counts) * 100

        if today_count == 0 and yesterday_count > 0:
            art_percentage = 0.1
        art_percentage = round(art_percentage, 2)

        # for last month earning percentage
        first_day_last_month = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
        last_day_last_month = now.replace(day=1) - timedelta(days=1)

        first_day_prev_month = (first_day_last_month - timedelta(days=1)).replace(day=1)
        last_day_prev_month = first_day_last_month - timedelta(days=1)

        last_month_total = Order.objects.filter(
            artist_id__in=artist,
            status="Fulfilled",
            created_at__date__gte=first_day_last_month,
            created_at__date__lte=last_day_last_month,
        ).aggregate(
            total=Coalesce(
                Sum("total"),
                Value(
                    Decimal("0.00"),
                    output_field=DecimalField(max_digits=20, decimal_places=2),
                ),
            )
        )[
            "total"
        ]

        prev_month_total = Order.objects.filter(
            artist_id__in=artist,
            status="Fulfilled",
            created_at__date__gte=first_day_prev_month,
            created_at__date__lte=last_day_prev_month,
        ).aggregate(
            total=Coalesce(
                Sum("total"),
                Value(
                    Decimal("0.00"),
                    output_field=DecimalField(max_digits=20, decimal_places=2),
                ),
            )
        )[
            "total"
        ]

        if prev_month_total > 0:
            last_month_percentage = float(
                ((last_month_total - prev_month_total) / prev_month_total) * 100
            )
        else:
            last_month_percentage = 100.0 if last_month_total > 0 else 0.0

        response = {
            "life_time_earnings": life_time_earnings,
            "payouts": payouts,
            "active_arts": active_arts,
            "orders_in_progress": orders_in_progress,
            "monthly_earnings": float(
                monthly_earnings
            ),  # convert Decimal -> float if needed
            "art_percentage_change": art_percentage,
            "last_month_earning_percentage": round(last_month_percentage, 2),
        }
        return self.send_success_response(data=response)


class AuctionView(BaseAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Auction.objects.all()
    serializer_class = AuctionCreateSerializer

    def list(self, request, *args, **kwargs):
        artist = request.GET.get("artist", None)
        auction_status = request.GET.get("status", None)
        search = request.GET.get("search", None)
        query = Auction.objects.filter(artist=request.user).order_by("start_time")
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

    def create(self, request, *args, **kwargs):
        data = request.data
        data["artist"] = request.user.id
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class AuctionBidView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = AuctionBid.objects.all()
    serializer_class = AuctionBidingSerializer

    def list(self, request, *args, **kwargs):
        auction_id = request.GET.get("auction_id")
        query = AuctionBid.objects.filter(id=auction_id).first()
        if query:
            serializer = self.serializer_class(query)
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message="Auction not found")


class ArtistListingDetail(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserDetailSerializer

    def list(self, request, *args, **kwargs):
        if self.request.user.role == "Organization":  # noqa
            artist = User.objects.filter(role="Artist", organization=self.request.user)
        else:
            artist = User.objects.filter(role="Artist")
        serializer = self.serializer_class(artist, many=True)
        return self.send_success_response(data=serializer.data)


class ArtistListingBuyerDetail(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UserDetailSerializer

    def list(self, request, *args, **kwargs):
        artist = User.objects.filter(role="Artist")
        serializer = self.serializer_class(artist, many=True)
        return self.send_success_response(data=serializer.data)


class OrganizationArtistListing(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = OrganizationArtistSerializer

    def list(self, request, *args, **kwargs):
        artist = User.objects.filter(role="Artist", organization=self.request.user)
        serializer = self.serializer_class(artist, many=True)
        return self.send_success_response(data=serializer.data)


class OrganizationRecentArts(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = ArtSerializer

    def list(self, request, *args, **kwargs):
        artist = User.objects.filter(
            role="Artist", organization=self.request.user
        ).values_list("id", flat=True)
        art = Art.objects.filter(artist_id__in=list(artist)).order_by("-created_at")
        serializer = self.serializer_class(art, many=True)
        return self.send_success_response(data=serializer.data)


class ArtistShopView(
    BaseAPIView, ListAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView
):
    permission_classes = [IsAuthenticated]
    queryset = ArtistShop.objects.all()
    serializer_class = ArtistShopCreateSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()  # make it mutable
        data["artist"] = request.user.id
        serializer = self.serializer_class(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        shop = ArtistShop.objects.filter(pk=pk).first()
        if not shop:
            return self.send_bad_request_response(message="Shop not found")
        data = request.data
        data["artist"] = request.user.id
        serializer = self.serializer_class(
            shop, data=data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        shop = ArtistShop.objects.filter(artist=request.user)
        serializer = ShopListingSerializer(shop, many=True)
        return self.send_success_response(data=serializer.data)

    def destroy(self, request, *args, **kwargs):
        pk = kwargs["pk"]
        shop = ArtistShop.objects.filter(pk=pk).first()
        if not shop:
            return self.send_bad_request_response(message="Shop not found")
        shop.delete()
        return self.send_success_response(message="Shop deleted")


class ArtistOrdersView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = SellerOrderSerializer

    def list(self, request, *args, **kwargs):
        if self.request.user.role == "Organization":
            organization_artist = list(
                User.objects.filter(
                    organization=request.user, role="Artist"
                ).values_list("id", flat=True)
            )
            organization_artist.append(self.request.user.id)
            artist = organization_artist
        else:
            artist = [request.user.id]
        orders = Order.objects.filter(artist_id__in=artist).order_by("-created_at")
        serializer = self.serializer_class(orders, many=True)
        return self.send_success_response(data=serializer.data)


class UpdateOrderStatus(BaseAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = UpdateOrderSerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        order = Order.objects.filter(id=data["order"]).first()
        if not order:
            return self.send_bad_request_response(message="Order not found")
        serializer = self.serializer_class(
            order, data=data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class ArtistDetailsView(BaseAPIView, RetrieveAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = ArtistDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        if not request.user.role == "Artist":
            return self.send_bad_request_response(message="You are not an artist")
        serializer = self.serializer_class(instance=request.user)
        return self.send_success_response(data=serializer.data)

    def update(self, request, *args, **kwargs):
        if not request.user.role == "Artist":
            return self.send_bad_request_response(message="You are not an artist")
        data = request.data
        serializer = self.serializer_class(
            instance=request.user, data=data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class ArtistDetailsGenericView(BaseAPIView, RetrieveAPIView, UpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = ArtistDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        artist = User.objects.filter(id=pk).first()
        if not artist:
            return self.send_bad_request_response(message="Artist not found")
        serializer = self.serializer_class(
            instance=request.user, context={"request": request}
        )
        return self.send_success_response(data=serializer.data)


class ArtistPortFolioView(BaseAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = ArtistPortFolioSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["artist"] = request.user.id
        serializer = self.serializer_class(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def update(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        shop = ArtistPortFolio.objects.filter(pk=pk).first()
        if not shop:
            return self.send_bad_request_response(message="Shop not found")
        data = request.data
        data["artist"] = request.user.id
        serializer = self.serializer_class(
            shop, data=data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)

    def destroy(self, request, *args, **kwargs):
        pk = kwargs["pk"]
        shop = ArtistPortFolio.objects.filter(pk=pk).first()
        if not shop:
            return self.send_bad_request_response(message="Shop not found")
        shop.delete()
        return self.send_success_response(message="Shop deleted")


class ArtistProfilePublicView(BaseAPIView, RetrieveAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = ArtistDetailPublicSerializer

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs["pk"]
        artist = User.objects.filter(id=pk).first()
        if not artist:
            return self.send_bad_request_response(message="Artist not found")
        serializer = self.serializer_class(artist)
        return self.send_success_response(data=serializer.data)


class ArtistFollowView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FollowArtistSerializer

    def create(self, request, *args, **kwargs):
        follow = ArtistFollow.objects.filter(
            follower=request.user, artist_id=request.data["artist"]
        ).first()
        if follow:
            follow.delete()
            return self.send_success_response(message="Artist Un-followed successfully")
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(follower=request.user)  # ✅ pass it here
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class GenerateOrderLabelView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        data = request.data
        orders = data["order_id"]
        for order in orders:
            order = Order.objects.filter(order_id=order).first()
            if order:
                existing_label = OrderLabel.objects.filter(order=order).first()
                if not existing_label:
                    label = generateLabel()
                    OrderLabel.objects.create(order=order, label=label)
        return self.send_success_response(message="Order labels created")


class SellerOrderStatsView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        orders = Order.objects.filter(artist=request.user).order_by("-created_at")
        pending_orders = orders.filter(status="Pending").count()
        in_transit_orders = orders.filter(status="In Transit").count()
        delivery_orders = orders.filter(status="Delivered").count()
        issues = OrderDispute.objects.filter(seller=request.user).count()
        response = {
            "pending_orders": pending_orders,
            "in_transit_orders": in_transit_orders,
            "delivery_orders": delivery_orders,
            "issues": issues,
        }
        return self.send_success_response(data=response)


class ShareArtView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ArtShare.objects.all()
    serializer_class = ArtShareSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["shared_by"] = request.user.id
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message=serializer.errors)


class UpdateArtGalleryView(BaseAPIView, UpdateAPIView, DestroyAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ArtGallery.objects.all()
    serializer_class = ArtGallerySerializer

    def update(self, request, *args, **kwargs):
        data = request.data
        files = request.FILES.getlist("images")
        art = Art.objects.filter(pk=data["art_id"]).first()
        if not art:
            return self.send_bad_request_response(message="Art not found")
        for image in files:
            ArtGallery.objects.create(art=art, image=image)
        return self.send_success_response(message="Image added in gallery")

    def destroy(self, request, *args, **kwargs):
        pk = kwargs["pk"]
        gallery = ArtGallery.objects.filter(pk=pk).first()
        if not gallery:
            return self.send_bad_request_response(message="Gallery image not found")
        gallery.delete()
        return self.send_success_response(message="Gallery deleted")

    def list(self, request, *args, **kwargs):
        pk = self.kwargs["pk"]
        gallery = ArtGallery.objects.filter(art_id=pk)
        serializer = self.serializer_class(gallery, many=True)
        return self.send_success_response(data=serializer.data)


def pct_change(curr: Decimal, prev: Decimal) -> float:
    """Return percentage change as a float rounded to 2 decimals.
    If previous is 0, return 0.0 to avoid divide-by-zero spikes."""
    prev = Decimal(prev or 0)
    curr = Decimal(curr or 0)
    if prev == 0:
        return 0.0
    return round(float(((curr - prev) / prev) * 100), 2)


class SalesEarningStatsView(ListAPIView, BaseAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        artist = request.user
        orders_qs = Order.objects.filter(artist=artist)
        today = timezone.localdate()
        month_start = today.replace(day=1)
        prev_month_end = month_start - timedelta(days=1)
        prev_month_start = prev_month_end.replace(day=1)
        agg = orders_qs.aggregate(
            total_earnings=Coalesce(Sum("total"), Decimal("0")),
            average_sale_price=Coalesce(Avg("total"), Decimal("0")),
        )
        this_month_qs = orders_qs.filter(
            paid_at__date__gte=month_start,
            paid_at__date__lte=today,
        )
        this_month_aggs = this_month_qs.aggregate(
            sales_amount=Coalesce(Sum("total"), Decimal("0")),
            avg_price=Coalesce(Avg("total"), Decimal("0")),
        )
        last_month_qs = orders_qs.filter(
            paid_at__date__gte=prev_month_start,
            paid_at__date__lte=prev_month_end,
        )
        last_month_aggs = last_month_qs.aggregate(
            sales_amount=Coalesce(Sum("total"), Decimal("0")),
            avg_price=Coalesce(Avg("total"), Decimal("0")),
        )
        pending_payouts = Payout.objects.filter(
            artist=artist,
            status__in=["Pending", "Processing"],
        ).aggregate(s=Coalesce(Sum("amount"), Decimal("0")))["s"]
        sales_amount_change_pct = pct_change(
            this_month_aggs["sales_amount"], last_month_aggs["sales_amount"]
        )
        avg_price_change_pct = pct_change(
            this_month_aggs["avg_price"], last_month_aggs["avg_price"]
        )

        data = {
            "total_earnings": str(agg["total_earnings"]),
            "pending_payouts": str(pending_payouts),
            "average_sale_price": str(round(agg["average_sale_price"], 3)),
            "this_month_sales_amount": str(this_month_aggs["sales_amount"]),
            "this_month_sales_amount_change_pct": sales_amount_change_pct,  # e.g., 23.1
            "average_sale_price_change_pct": avg_price_change_pct,  # e.g., 5.7
        }
        return self.send_success_response(data=data)


class ArtistPayoutView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = PayoutSerializer

    def list(self, request, *args, **kwargs):
        payout = Payout.objects.filter(artist=request.user, status="Pending")
        serializer = self.serializer_class(payout, many=True)
        return self.send_success_response(data=serializer.data)


class ArtistPayoutHistoryView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = PayoutSerializer

    def list(self, request, *args, **kwargs):
        payout = Payout.objects.filter(artist=request.user, status="Paid")
        serializer = self.serializer_class(payout, many=True)
        return self.send_success_response(data=serializer.data)


class ArtRevenueBreakDownView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def list(self, request, *args, **kwargs):
        order = Order.objects.filter(artist=request.user).values_list("id", flat=True)
        art = Art.objects.aggregate(total_price=Sum("price"))["total_price"] or 0
        response = {
            "art_revenue_breakdown": art,
        }
        return self.send_success_response(data=response)


class TopPerformanceArtView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = ArtSalesSerializer

    def list(self, request, *args, **kwargs):
        order = Order.objects.filter(artist=request.user).values_list("id", flat=True)
        art = Art.objects.filter(id__in=order).order_by("-price")
        serializer = self.serializer_class(art, many=True)
        return self.send_success_response(data=serializer.data)


class PrimarySalesView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = PrimarySalesSerializer

    def list(self, request, *args, **kwargs):
        orders = Order.objects.filter(artist=request.user)
        serializer = self.serializer_class(orders, many=True)
        return self.send_success_response(data=serializer.data)


class FraudDetectionArt(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        data = request.data
        similar = INDEX.find_top1(data["image"], 0.9)
        if similar:
            art = Art.objects.filter(id=similar["id"]).first()
            if art:
                serializer = ArtDetailSerializer(art)
                data = serializer.data
                data["cosine"] = similar["cosine"]
                return self.send_success_response(data=data)
        return self.send_success_response(message="No Similar Art Found")


class ChallengeView(BaseAPIView, CreateAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = OrganizationChallengeCreateSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        data["organization"] = request.user.id
        serializer = self.serializer_class(
            data=data, context={"request_user": request.user}
        )
        if serializer.is_valid():
            serializer.save()
            return self.send_success_response(data=serializer.data)
        return self.send_success_response(message=serializer.errors)

    def list(self, request, *args, **kwargs):
        challenge = OrganizationChallenge.objects.filter(organization=request.user)
        serializer = self.serializer_class(
            challenge, many=True, context={"request_user": request.user}
        )
        return self.send_success_response(data=serializer.data)


class EventsView(BaseAPIView, ListAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = EventSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if (
            "arts" in data
            and isinstance(data.get("arts"), str)
            and "," in data.get("arts")
        ):
            data.setlist(
                "arts", [s.strip() for s in data.get("arts").split(",") if s.strip()]
            )

        serializer = self.get_serializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return self.send_success_response(data=self.get_serializer(instance).data)

    def list(self, request, *args, **kwargs):
        events = Event.objects.filter(user=request.user)
        search = request.query_params.get("search")
        if search:
            events = events.filter(title__icontains=search)
        serializer = SellerEventListingSerializer(events, many=True)
        return self.send_success_response(data=serializer.data)


class ArtOfferListingView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = ArtOfferSerializer

    def list(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = Art.objects.filter(id=pk).first()
        if not art:
            return self.send_success_response(message="No Art Found")
        offers = BuyerOffers.objects.filter(art=art).order_by("-amount")
        serializer = self.serializer_class(offers, many=True)
        return self.send_success_response(data=serializer.data)


class AcceptOfferView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        data = request.data
        offer = BuyerOffers.objects.filter(
            id=data["offer_id"], art__artist=request.user
        ).last()
        if not offer:
            return self.send_bad_request_response(message="No Offer Found")
        accepted_offer = BuyerOffers.objects.filter(
            art=offer.art, is_accepted=True
        ).exists()
        if accepted_offer:
            return self.send_bad_request_response(message="Offer Already Accepted")
        offer.is_accepted = True
        offer.save()
        return self.send_success_response(message="Offer Accepted")

class ChallengeGETListView(BaseAPIView, ListAPIView):
    permission_classes = []
    queryset = None
    serializer_class = OrganizationChallengeCreateSerializer

    def list(self, request, *args, **kwargs):
        challenge = OrganizationChallenge.objects.all()
        serializer = self.serializer_class(challenge, many=True)
        return self.send_success_response(data=serializer.data)


class JoinOrgChallengeView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            serializer = JoinOrgChallengeSerializers(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save()
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message="Invalid request")


class DiscussionViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = UserDiscussion.objects.all().order_by("-id")
    serializer_class = DiscussionSerializer
    permission_classes = []

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        try:
            qs = self.get_queryset()
            serializer = DiscussionSerializer(
                qs, many=True, context={"request": request}
            )
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def get_permissions(self):
        if self.action == "list":
            return []
        return [IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.is_authenticated and instance.user != request.user:

            viewed = DiscussionView.objects.filter(
                discussion=instance, user=request.user
            ).exists()

            if not viewed:
                DiscussionView.objects.create(discussion=instance, user=request.user)
                instance.views_count += 1
                instance.save(update_fields=["views_count"])

        serializer = self.get_serializer(instance)
        return self.send_success_response(data=serializer.data)


class BoardFavoriteViewSet(BaseAPIView, viewsets.ModelViewSet):
    queryset = UserBoard.objects.all().order_by("-id")
    serializer_class = UserBoardSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        try:
            qs = self.get_queryset()
            serializer = UserBoardSerializer(qs, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def add_art_board_favorite(self, request, *args, **kwargs):
        try:
            user = request.user
            serializer = UserBoardCollectionSerializers(
                data=request.data, context={"request": request}
            )
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=user)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))

    def board_collection(self, request, *args, **kwargs):
        try:
            user = request.user
            board_id = request.query_params.get("board_id")
            if not board_id:
                return self.send_bad_request_response(
                    message="board_id is required in query_parms"
                )
            board_data = UserBoardCollection.objects.filter(board_collection=board_id)
            serializer = BoardCollectionsSerializer(board_data, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class DiscussionTopicsView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []

    def list(self, request, *args, **kwargs):
        try:
            qs = (
                UserDiscussion.objects.values("title")
                .annotate(latest_id=Max("id"))
                .order_by("-latest_id")
                .values_list("title", flat=True)[:6]
            )
            return self.send_success_response(data=list(qs))
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class TrendingTopicsView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []

    def list(self, request, *args, **kwargs):
        try:
            data = {
                "digital_art": 1.2,
                "emerging_artist": 1.2,
                "nft_collection": 1.2,
                "art_tech": 1.2,
                "contemporary_art": 1.2,
            }
            return self.send_success_response(data=data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class OffersListingGetView(BaseAPIView, ListAPIView):
    permission_classes = []
    serializer_class = BuyerOfferListSerializer

    def list(self, request, *args, **kwargs):
        try:
            filter_type = request.GET.get("filter", "all")

            offers = BuyerOffers.objects.filter(art__artist=request.user).select_related("art", "art__artist").order_by(
                "-id"
            )

            now_time = timezone.now()
            expired_time = now_time - timedelta(days=7)

            if filter_type == "pending":
                offers = offers.filter(
                    is_accepted=False, is_rejected=False, created_at__gte=expired_time
                )

            elif filter_type == "accepted":
                offers = offers.filter(is_accepted=True)

            elif filter_type == "rejected":
                offers = offers.filter(is_rejected=True)

            elif filter_type == "expired":
                offers = offers.filter(is_accepted=False, created_at__lt=expired_time)

            total_pending_count = BuyerOffers.objects.filter(
                is_accepted=False, is_rejected=False, created_at__gte=expired_time
            ).count()
            total_accepted_count = BuyerOffers.objects.filter(is_accepted=True).count()

            average_amount = (
                BuyerOffers.objects.aggregate(avg=Avg("amount"))["avg"] or 0
            )
            total_art_price = (
                BuyerOffers.objects.aggregate(total=Sum("art__price"))["total"] or 0
            )

            serializer = self.serializer_class(offers, many=True)

            return self.send_success_response(
                data={
                    "results": serializer.data,
                    "total_pending_count": total_pending_count,
                    "total_accepted_count": total_accepted_count,
                    "average_amount": round(average_amount, 2),
                    "total_art_price": total_art_price,
                }
            )
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class RejectOfferView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RejectOfferSerializer

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)

            offer_id = serializer.validated_data["offer_id"]
            reason = serializer.validated_data["reason"]

            offer = BuyerOffers.objects.get(id=offer_id)
            offer.is_rejected = True
            offer.reason = reason
            offer.save(update_fields=["reason", "is_rejected"])

            return self.send_success_response(message="Offer rejected successfully.")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class CounterOfferView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CounterOfferSerializer

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.serializer_class(data=request.data)
            if not serializer.is_valid():
                return self.send_bad_request_response(message=serializer.errors)
            serializer.save(user=request.user)
            return self.send_success_response(
                message="Counter Offer send successfully."
            )
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class CounterOffersListingGetView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CounterOfferSerializer

    def list(self, request, *args, **kwargs):
        try:
            art_id = kwargs["art_id"]
            if not art_id:
                return self.send_bad_request_response(message="Art id is required.")
            queryset = BuyerCounterOffers.objects.filter(art_id=art_id).order_by("-id")
            serializer = self.serializer_class(queryset, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ArtworkSearchView(BaseAPIView, ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ArtSearchSerializer
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = Art.objects.select_related("artist")

        query = self.request.GET.get("q")
        category = self.request.GET.get("category")
        medium = self.request.GET.get("medium")
        art_type = self.request.GET.get("art_type")
        min_price = self.request.GET.get("min_price")
        max_price = self.request.GET.get("max_price")

        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(category__icontains=query)
                | Q(medium__icontains=query)
                | Q(location__icontains=query)
                | Q(art_tags__icontains=query)
                | Q(artist__first_name__icontains=query)
                | Q(artist__last_name__icontains=query)
            )

        if query:
            queryset = queryset.filter(title__icontains=query)
        if category:
            queryset = queryset.filter(category__iexact=category)

        if medium:
            queryset = queryset.filter(medium__iexact=medium)

        if art_type:
            queryset = queryset.filter(art_type=art_type)

        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset.order_by("-created_at")


class FinalizeAuctionView(BaseAPIView, CreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = None

    def create(self, request, *args, **kwargs):
        now = timezone.now()
        pk = self.kwargs["pk"]
        auction = Auction.objects.filter(artist=request.user, id=pk).first()
        if not auction:
            return self.send_bad_request_response(message="Auction not found.")
        if auction.status == 'Finalized':
            return self.send_bad_request_response(message="Auction already finalized.")
        if now <= auction.end_time:
            return self.send_bad_request_response(message="Auction end time must be after now.")
        highes_bids = AuctionBid.objects.filter(auction=auction).order_by("-amount").first()
        if not highes_bids:
            return self.send_bad_request_response(message="No valid bids found.")
        amount = highes_bids.amount
        shipping_cost = 2
        tax_amount = 2
        platform_fee = 3
        try:
            with transaction.atomic():
                ArtOwner.objects.create(art=auction.art, owner=highes_bids.bidder, factions=1)
                auction.art.is_sold = True
                auction.art.save()
                order = Order.objects.create(
                    buyer=highes_bids.bidder,
                    auction=auction,
                    art=auction.art,
                    artist=auction.artist,
                    status="Pending",
                    no_of_fractions=1,
                    shipping_cost=shipping_cost,
                    tax_amount=tax_amount,
                    platform_fee=platform_fee,
                    discount_total=0,
                    total=amount + shipping_cost + tax_amount + platform_fee,
                    payment_status="Captured",
                    paid_at=datetime.now(),
                    fulfilled_at=datetime.now(),
                    eta=datetime.now() + timedelta(days=15),
                )
                PaymentTransaction.objects.create(
                    order=order,
                    amount=order.total,
                    status="Captured",
                )
                Payout.objects.create(
                    order=order,
                    art=auction.art,
                    artist=auction.artist,
                    scheduled_for=datetime.now() + timedelta(days=15),
                    amount=amount,
                )
                auction.status = "Finalized"
                auction.final_price = amount
                auction.save()
                return self.send_success_response(message="Auction finalized")
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class TransactionsHistoryView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = None
    serializer_class = TransactionHistorySerializer

    def list(self, request, *args, **kwargs):
        user = self.request.user
        if user.role == 'Customer': # noqa
            orders = Order.objects.filter(buyer=user).values_list('id', flat=True).order_by('-created_at')
            payments = PaymentTransaction.objects.filter(order_id__in=orders)
            serializer = self.serializer_class(payments, many=True)
            return self.send_success_response(data=serializer.data)
        elif user.role == 'Artist':
            orders = Order.objects.filter(artist=user).values_list('id', flat=True).order_by('-created_at')
            payments = PaymentTransaction.objects.filter(order_id__in=orders)
            serializer = self.serializer_class(payments, many=True)
            return self.send_success_response(data=serializer.data)
        return self.send_bad_request_response(message="Invalid role")