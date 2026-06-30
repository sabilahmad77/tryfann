from django.db.models import Count, Value, CharField, Subquery, OuterRef
from django.db.models.functions import Coalesce

from fann.artist.models import Art, ArtistFollow, Auction, ArtistShop, ArtReviews
from fann.artist.serializers import (
    SliderArtSerializer,
    ArtSerializer,
    EmergingArtistSerializer,
    ArtWithGallerySerializer,
    ArtPricingSerializer,
    LiveAuctionSerializer,
    RealWorldArtSerializer,
    ArtistShopGetSerializer,
    FamousArtistSerializer,
    ParticularArtistSerializer,
    FractionalArtSerializer,
    FractionalArtGetSerializer,
)
from fann.common.response_mixins import BaseAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.db.models import Count
from fann.users.models import User


class SliderTopArtsView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = SliderArtSerializer

    def list(self, request, *args, **kwargs):
        arts = Art.objects.filter().order_by("-created_at")[:5]
        serializer = self.get_serializer(arts, many=True)
        return self.send_success_response(data=serializer.data)


class MarketPlaceAllArtView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = ArtSerializer

    def list(self, request, *args, **kwargs):
        category = request.query_params.get("category", None)
        arts = Art.objects.filter().order_by("-created_at")
        if category:
            arts = arts.filter(category=category)
        serializer = self.get_serializer(arts, many=True)
        return self.send_success_response(data=serializer.data)


class EmergingArtistView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = EmergingArtistSerializer

    def list(self, request, *args, **kwargs):
        top_artists = (
            User.objects.filter(role="Artist")
            .annotate(followers_count=Count("artist_follower", distinct=True))
            .order_by("-followers_count", "-created_at")
        )
        serializer = self.get_serializer(top_artists, many=True)
        return self.send_success_response(data=serializer.data)


class ArtCountByCategory(ListAPIView, BaseAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = Art.objects.none()
    serializer_class = None

    def list(self, request, *args, **kwargs):
        sample_img_subq = (
            Art.objects.filter(category=OuterRef("category"))
            .exclude(image__isnull=True)
            .exclude(image="")
            .order_by("-created_at")
            .values("image")[:1]
        )
        categories = (
            Art.objects.values("category")
            .annotate(
                category_name=Coalesce(
                    "category", Value("Uncategorized"), output_field=CharField()
                ),
                count=Count("id"),
                sample_image=Subquery(sample_img_subq),
            )
            .order_by("-count", "category_name")
        )

        results = []
        for row in categories:
            rel_path = row["sample_image"]
            abs_img = rel_path
            results.append(
                {
                    "category": row["category_name"],
                    "count": row["count"],
                    "image": abs_img,
                }
            )

        return self.send_success_response(data=results)


class ArtRetireveMarketPlaceView(BaseAPIView, RetrieveAPIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = ArtWithGallerySerializer
    queryset = Art.objects.all()

    def retrieve(self, request, *args, **kwargs):
        pk = self.kwargs.get("pk")
        art = Art.objects.filter(id=pk).first()
        if not art:
            return self.send_bad_request_response(message="Art not found")
        serializer = self.serializer_class(art, context={"request": request})
        return self.send_success_response(data=serializer.data)


class ArtPricingView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = ArtPricingSerializer

    def list(self, request, *args, **kwargs):
        try:
            art_type_query = request.query_params.get("type")
            arts = Art.objects.filter(art_type="Single").order_by("-created_at")

            if art_type_query and art_type_query.lower() == "offers":
                arts = Art.objects.filter(art_type="Offers").order_by("-created_at")

            serializer = self.get_serializer(arts, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class LiveAuctionView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = LiveAuctionSerializer

    def list(self, request, *args, **kwargs):
        try:
            all_live_auctions = Auction.objects.filter(status="Live").order_by(
                "-created_at"
            )
            serializer = self.get_serializer(all_live_auctions, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ArtistShopGetView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = ArtistShopGetSerializer

    def list(self, request, *args, **kwargs):
        try:
            arts = ArtistShop.objects.all().order_by("-created_at")
            serializer = self.get_serializer(arts, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class RealWorldArtView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    queryset = None
    serializer_class = RealWorldArtSerializer

    def list(self, request, *args, **kwargs):
        try:
            arts = Art.objects.filter(hash__isnull=False).order_by("-created_at")
            serializer = self.get_serializer(arts, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class FamousArtistView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = FamousArtistSerializer

    def list(self, request, *args, **kwargs):
        try:
            arts = Art.objects.annotate(
                follower_count=Count("artist__artist_follower")
            ).order_by("-follower_count")

            serializer = self.get_serializer(arts, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ParticularArtistView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = ParticularArtistSerializer

    def list(self, request, *args, **kwargs):
        try:
            artist_id = request.query_params.get("artist_id")

            if artist_id:
                arts = Art.objects.filter(artist_id=artist_id)
            else:
                arts = Art.objects.annotate(
                    particular_count=Count("wishlist")
                ).order_by("-particular_count")

            serializer = self.get_serializer(arts, many=True)
            return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class FractionalArtistView(BaseAPIView, ListAPIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = FractionalArtSerializer

    def get(self, request, *args, **kwargs):
        try:
            art_id = kwargs.get("pk", None)
            search_query = request.query_params.get("search", None)

            if art_id:
                art = Art.objects.filter(pk=art_id, art_type="Fractional").first()
                if not art:
                    return self.send_bad_request_response(
                        message="Art fractional records does not found!"
                    )
                serializer = FractionalArtGetSerializer(art)
                return self.send_success_response(data=serializer.data)
            else:
                arts = Art.objects.filter(art_type="Fractional").order_by("-created_at")
                if search_query:
                    arts = arts.filter(title__icontains=search_query)
                serializer = self.get_serializer(arts, many=True)
                return self.send_success_response(data=serializer.data)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))
