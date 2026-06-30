import json
from fann.artist.faiss_algo import INDEX
from django.db import transaction
from django.db.models import Avg, Count, Sum
from rest_framework import serializers
from django.db.models.functions import Coalesce

from fann.artist.models import (
    Art,
    Auction,
    ArtComment,
    AuctionBid,
    Order,
    ArtReviews,
    ArtGallery,
    ArtOwner,
    ArtistFollow,
    ArtWishList,
    ArtViewCount,
    ArtistShop,
    OrderLabel,
    ArtShare,
    Payout,
    ChallengeAttachments,
    OrganizationChallenge,
    Event,
    BuyerRSVP,
    BuyerOffers,
    OrganizationChallengeParticipant,
    UserDiscussion,
    UserBoard,
    UserBoardCollection,
    BuyerCounterOffers, PaymentTransaction,
)
from fann.users.models import User, KYCSubmission, ArtistPortFolio
from django.utils.timesince import timesince
from django.utils import timezone
from datetime import timedelta


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]


class ArtSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField(method_name="get_reviews")
    comments_count = serializers.SerializerMethodField(method_name="get_comments_count")
    likes = serializers.SerializerMethodField(method_name="get_likes")
    views = serializers.SerializerMethodField(method_name="get_views")
    auction = serializers.SerializerMethodField(method_name="get_auction")
    artist = UserDetailSerializer()

    class Meta:
        model = Art
        fields = "__all__"

    def get_auction(self, obj):
        auction = (
            Auction.objects.filter(status__in=["Live", "Upcoming"], art=obj)
            .order_by("-created_at")
            .first()
        )
        if auction:
            return auction.id
        return None

    def get_reviews(self, obj):
        reviews_summary = (
            ArtReviews.objects.filter(art=obj)
            .values("art_id")
            .annotate(avg_rating=Avg("rating"), review_count=Count("id"))
        )
        return reviews_summary

    def get_comments_count(self, obj):
        comments = ArtComment.objects.filter(art=obj).count()
        return comments

    def get_likes(self, obj):
        likes = ArtWishList.objects.filter(art=obj).count()
        return likes

    def get_views(self, obj):
        views = ArtViewCount.objects.filter(art=obj).first()
        if views:
            return views.count
        return 0


class ArtGallerySerializer(serializers.ModelSerializer):

    class Meta:
        model = ArtGallery
        fields = "__all__"


class ArtWithGallerySerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    views = serializers.SerializerMethodField()
    artist = UserDetailSerializer()
    # NEW: galleries from related_name="gallery" on ArtGallery
    galleries = serializers.SerializerMethodField(method_name="get_galleries")
    artist_follow = serializers.SerializerMethodField()

    class Meta:
        model = Art
        fields = "__all__"

    def get_galleries(self, obj):
        gallery = ArtGallery.objects.filter(art=obj)
        return ArtGallerySerializer(gallery, many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["galleries"] = ArtGallerySerializer(
            instance.gallery.all(), many=True, context=self.context
        ).data
        data["artist_follow"] = self.get_artist_follow(instance)
        return data

    def get_artist_follow(self, obj) -> bool:
        """
        True if authenticated request.user follows obj.artist.
        False for anonymous users or self-follow (you can tweak this).
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if obj.artist_id == user.id:
            return False  # usually you don't "follow" yourself; change if your product says otherwise
        return ArtistFollow.objects.filter(
            artist=obj.artist_id, follower=user.id
        ).exists()

    def get_reviews(self, obj):
        reviews_summary = (
            ArtReviews.objects.filter(art=obj)
            .values("art_id")
            .annotate(avg_rating=Avg("rating"), review_count=Count("id"))
        )
        return reviews_summary

    def get_comments_count(self, obj):
        return ArtComment.objects.filter(art=obj).count()

    def get_likes(self, obj):
        return ArtWishList.objects.filter(art=obj).count()

    def get_views(self, obj):
        views = ArtViewCount.objects.filter(art=obj).first()
        return views.count if views else 0


class ArtCreateFixedPriceSerializer(serializers.ModelSerializer):
    gallery = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Art
        fields = "__all__"  # includes 'gallery' virtual field

    def create(self, validated_data):
        request = self.context["request"]
        data = request.data
        gallery = validated_data.pop("gallery", [])
        with transaction.atomic():
            remaining_fraction = validated_data.get("no_of_fraction")
            art = Art.objects.create(**validated_data)
            art.remaining_fractions = remaining_fraction
            art.save()
            for image in gallery:
                ArtGallery.objects.create(art=art, image=image)
            INDEX.add_image(art.id, data["image"])
        return art


class ArtCreateAuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = "__all__"

    def create(self, validated_data):
        request = self.context["request"]
        data = request.data.copy()
        gallery_files = request.FILES.getlist("gallery")  # <-- important
        with transaction.atomic():
            art = Art.objects.create(**validated_data)
            auction = Auction.objects.create(
                art=art,
                artist=request.user,
                start_time=data["start_time"],
                end_time=data["end_time"],
                min_bid_increment=data["min_bid_increment"],
                buy_now_price=data["buy_now_price"],
                reserve_price=data["reserve_price"],
                starting_bid=data["starting_bid"],
                auction_id=data["auction_id"],
            )
            for image in gallery_files:
                ArtGallery.objects.create(art=art, image=image)
            INDEX.add_image(art.id, data["image"])
        return art


class ArtAuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = "__all__"


class CommentsSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)

    class Meta:
        model = ArtComment
        fields = "__all__"


class AuctionBidingSerializer(serializers.ModelSerializer):
    art = serializers.SerializerMethodField(method_name="get_art")

    class Meta:
        model = AuctionBid
        fields = "__all__"

    def get_art(self, obj):
        if obj.auction.art:
            return ArtSerializer(obj.auction.art).data
        return None


class OrderSerializer(serializers.ModelSerializer):
    art = serializers.SerializerMethodField(method_name="get_art")

    class Meta:
        model = Order
        fields = "__all__"

    def get_art(self, obj):
        if obj.art:
            return ArtSerializer(obj.art).data
        return None


class AuctionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = "__all__"


class AuctionListSerializer(serializers.ModelSerializer):
    art = serializers.SerializerMethodField(method_name="get_art")

    class Meta:
        model = Auction
        fields = "__all__"

    def get_art(self, obj):
        if obj.art:
            return ArtSerializer(obj.art).data
        return None


class OrganizationArtistSerializer(serializers.ModelSerializer):
    art_counts = serializers.SerializerMethodField(method_name="get_art_counts")

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "art_counts"]

    def get_art_counts(self, obj):
        arts_counts = Art.objects.filter(artist=obj).count()
        return arts_counts


class SliderArtSerializer(serializers.ModelSerializer):
    artist = UserDetailSerializer()

    class Meta:
        model = Art
        fields = "__all__"


class EmergingArtistSerializer(serializers.ModelSerializer):
    followers = serializers.SerializerMethodField(method_name="get_followers")

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "followers",
            "profile_image",
        ]

    def get_followers(self, obj):
        followers = ArtistFollow.objects.filter(artist=obj).count()
        return followers


class FollowArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistFollow
        fields = ["artist"]  # exclude 'follower'


class ArtistShopCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistShop
        fields = ["id", "artist", "name", "description", "profile_image"]

    def create(self, validated_data):
        import ast

        request = self.context["request"]
        data = request.data
        arts = Art.objects.filter(id__in=json.loads(data["arts"]))
        shop = ArtistShop.objects.create(**validated_data)
        if arts:
            shop.arts.set(arts)  # bulk set M2M
        return shop

    def update(self, instance, validated_data):
        request = self.context["request"]
        data = request.data
        arts = Art.objects.filter(id__in=data["arts"])
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if arts is not None:
            instance.arts.set(arts)
        return instance


class ArtDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = "__all__"


class ShopListingSerializer(serializers.ModelSerializer):
    arts = ArtDetailSerializer(many=True, read_only=True)

    class Meta:
        model = ArtistShop
        fields = "__all__"


class ArtOrderDetail(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = ["id", "title", "price", "discount_price", "image"]


class SellerOrderSerializer(serializers.ModelSerializer):
    art = ArtOrderDetail()
    labels = serializers.SerializerMethodField(method_name="get_labels")
    sale_id = serializers.SerializerMethodField(method_name="get_sale_id")
    auction_id = serializers.SerializerMethodField(method_name="get_auction_id")

    class Meta:
        model = Order
        fields = "__all__"

    def get_labels(self, obj):
        label = OrderLabel.objects.filter(order=obj).last()
        if label:
            return label.label
        return None

    def get_sale_id(self, obj):
        try:
            return obj.art.sale_id
        except:
            return None

    def get_auction_id(self, obj):
        auction = Auction.objects.filter(art=obj.art).last()
        if auction:
            return auction.auction_id
        return None


class UpdateOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"

    def update(self, instance, validated_data):
        if validated_data["status"] in ["Delivered", "Completed", "Canceled"]:
            raise serializers.ValidationError(
                f'Artist can not update order to {validated_data["status"]}'
            )
        instance.status = validated_data["status"]
        instance.save()
        return instance


class ArtistPortFolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtistPortFolio
        fields = "__all__"


class ArtistDetailSerializer(serializers.ModelSerializer):
    kyc_status = serializers.SerializerMethodField(method_name="get_kyc_status")
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
    is_follow = serializers.SerializerMethodField(method_name="get_is_follow")

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "age",
            "about",
            "socials",
            "website",
            "interests",
            "timezone",
            "kyc_status",
            "portfolio",
            "location",
            "collection_overview",
            "profile_image",
            "banner",
            "shops",
            "is_follow",
        ]
        extra_kwargs = {
            "socials": {"required": False},
            "website": {"required": False},
            "interests": {"required": False},
        }

    def get_is_follow(self, obj):
        request = self.context["request"]
        follow = ArtistFollow.objects.filter(artist=obj, follower=request.user).exists()
        return follow

    def get_kyc_status(self, obj):
        kyc = KYCSubmission.objects.filter(user=obj).first()
        if kyc:
            return kyc.status
        return "Pending"

    def get_shops(self, obj):
        shops = ArtistShop.objects.filter(artist=obj)
        return ShopListingSerializer(shops, many=True).data

    def get_portfolio(self, obj):
        port_folio = ArtistPortFolio.objects.filter(artist=obj)
        return ArtistPortFolioSerializer(port_folio, many=True).data

    def get_collection_overview(self, obj):
        arts = Art.objects.filter(artist=obj).count()
        return {
            "art_counts": arts,
            "total_spent": 25353,
            "following_arts": 23,
            "events_attend": 3,
        }


class ArtistUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "age",
            "about",
            "socials",
            "website",
            "interests",
            "timezone",
            "location",
        ]


class ArtistShopSerializer(serializers.ModelSerializer):
    arts = ArtSerializer(many=True, read_only=True)

    class Meta:
        model = ArtistShop
        fields = "__all__"


class ArtistDetailPublicSerializer(serializers.ModelSerializer):
    portfolio = serializers.SerializerMethodField(method_name="get_portfolio")
    shops = serializers.SerializerMethodField(method_name="get_shops")
    collection_overview = serializers.SerializerMethodField(
        method_name="get_collection_overview"
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "age",
            "about",
            "socials",
            "website",
            "interests",
            "timezone",
            "portfolio",
            "location",
            "collection_overview",
            "shops",
        ]

    def get_portfolio(self, obj):
        port_folio = ArtistPortFolio.objects.filter(artist=obj)
        return ArtistPortFolioSerializer(port_folio, many=True).data

    def get_shops(self, obj):
        shops = ArtistShop.objects.filter(artist=obj)
        serializer = ArtistShopSerializer(shops, many=True)
        return serializer.data

    def get_collection_overview(self, obj):
        arts = Art.objects.filter(artist=obj).count()
        return {
            "art_counts": arts,
            "total_spent": 25353,
            "following_arts": 23,
            "events_attend": 3,
        }


class ArtShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtShare
        fields = "__all__"


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = "__all__"


class ArtSalesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = ["id", "price", "image", "title"]


class PrimarySalesSerializer(serializers.ModelSerializer):
    payment_status = serializers.SerializerMethodField(method_name="get_payment_status")
    art_details = serializers.SerializerMethodField(method_name="get_art_details")
    sold_to = serializers.SerializerMethodField(method_name="get_sold_to")

    class Meta:
        model = Order
        fields = [
            "order_id",
            "status",
            "payment_status",
            "sold_to",
            "art_details",
            "created_at",
        ]

    def get_payment_status(self, obj):
        payout = Payout.objects.filter(order=obj).first()
        if payout:
            return payout.status
        return None

    def get_art_details(self, obj):
        return ArtSalesSerializer(obj.art).data

    def get_sold_to(self, obj):
        return obj.buyer.first_name + " " + obj.buyer.last_name


class ChallengeAttachmentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeAttachments
        fields = "__all__"


class OrganizationChallengeCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(allow_empty_file=False, required=True),
        write_only=True,
        required=False,
        help_text="List of files for challenge attachments",
    )

    challenge_image = serializers.FileField(required=False, allow_empty_file=False)
    challenge_attachments = ChallengeAttachmentReadSerializer(many=True, read_only=True)
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationChallenge
        fields = "__all__"

    def get_is_joined(self, challenge):
        request_user = self.context.get("request_user")
        if not request_user:
            return False
        return OrganizationChallengeParticipant.objects.filter(
            challenge=challenge, user=request_user
        ).exists()

    def validate(self, attrs):
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "end_date must be on or after start_date."}
            )

        reward_amount = attrs.get("reward_amount")
        if reward_amount is not None and reward_amount < 0:
            raise serializers.ValidationError({"reward_amount": "Must be ≥ 0."})

        no_of_winners = attrs.get("no_of_winners")
        if no_of_winners is not None and no_of_winners < 0:
            raise serializers.ValidationError({"no_of_winners": "Must be ≥ 0."})

        return attrs

    def create(self, validated_data):
        attachment_files = validated_data.pop("attachments", [])
        with transaction.atomic():
            challenge = OrganizationChallenge.objects.create(**validated_data)
            if attachment_files:
                ChallengeAttachments.objects.bulk_create(
                    [
                        ChallengeAttachments(challenge=challenge, image=f)
                        for f in attachment_files
                    ]
                )

        challenge.refresh_from_db()
        return challenge


class EventSerializer(serializers.ModelSerializer):
    arts = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Art.objects.all(), required=False
    )

    class Meta:
        model = Event
        fields = "__all__"

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )

        maxp = attrs.get(
            "max_participants", getattr(self.instance, "max_participants", 0)
        )
        if maxp is not None and maxp < 0:
            raise serializers.ValidationError(
                {"max_participants": "Must be zero or a positive integer."}
            )
        return attrs

    def create(self, validated_data):
        arts = validated_data.pop("arts", [])
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["user"] = request.user

        event = Event.objects.create(**validated_data)
        if arts:
            event.arts.set(arts)
        return event


class SellerEventListingSerializer(serializers.ModelSerializer):
    attendees = serializers.SerializerMethodField(method_name="get_attendees")
    arts = ArtDetailSerializer(many=True, read_only=True)
    video_link = serializers.SerializerMethodField(method_name="get_video_link")

    class Meta:
        model = Event
        fields = "__all__"

    def get_attendees(self, obj):
        rsvp = BuyerRSVP.objects.filter(event=obj).count()
        return rsvp

    def get_video_link(self, obj):
        if obj.status == "Ended":
            return "https://www.youtube.com/watch?v=dgLzHz3gTAI"
        return None


class ArtOfferSerializer(serializers.ModelSerializer):
    buyer = UserDetailSerializer()

    class Meta:
        model = BuyerOffers
        fields = "__all__"


class ArtPricingSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    first_name = serializers.CharField(source="artist.first_name", read_only=True)
    last_name = serializers.CharField(source="artist.last_name", read_only=True)
    email = serializers.EmailField(source="artist.email", read_only=True)

    class Meta:
        model = Art
        fields = [
            "id",
            "title",
            "description",
            "price",
            "art_type",
            "image",
            "category",
            "first_name",
            "last_name",
            "email",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class LiveAuctionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Auction
        fields = "__all__"
        depth = 1


class ArtistShopGetSerializer(serializers.ModelSerializer):

    class Meta:
        model = ArtistShop
        fields = "__all__"
        depth = 1


class RealWorldArtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = "__all__"
        depth = 1


class FamousArtistSerializer(serializers.ModelSerializer):
    follower_count = serializers.IntegerField(read_only=True)
    isFollow = serializers.BooleanField(default=False, read_only=True)
    first_name = serializers.CharField(source="artist.first_name", read_only=True)
    last_name = serializers.CharField(source="artist.last_name", read_only=True)
    email = serializers.EmailField(source="artist.email", read_only=True)
    profile_image = serializers.ImageField(
        source="artist.profile_image", read_only=True
    )

    class Meta:
        model = Art
        fields = "__all__"
        depth = 1


class ParticularArtistSerializer(serializers.ModelSerializer):
    particular_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Art
        fields = "__all__"
        depth = 1


class FractionalArtSerializer(serializers.ModelSerializer):
    share_count = serializers.SerializerMethodField()
    share_percentage = serializers.SerializerMethodField()
    art_view_count = serializers.SerializerMethodField()

    class Meta:
        model = Art
        fields = [
            "id",
            "title",
            "description",
            "price",
            "image",
            "no_of_fraction",
            "units",
            "share_count",
            "share_percentage",
            "art_view_count",
        ]

    def get_share_count(self, obj):
        return obj.art_share.count()

    def get_share_percentage(self, obj):
        share_count = obj.art_share.count()
        return round((share_count / 100) * 100, 2)

    def get_art_view_count(self, obj):
        total_views = obj.views.aggregate(total_count=Coalesce(Sum("count"), 0))[
            "total_count"
        ]
        return total_views


class FractionalArtGetSerializer(serializers.ModelSerializer):
    share_count = serializers.SerializerMethodField()
    share_percentage = serializers.SerializerMethodField()
    art_view_count = serializers.SerializerMethodField()

    class Meta:
        model = Art
        fields = "__all__"
        depth = 1

    def get_share_count(self, obj):
        return obj.art_share.count()

    def get_share_percentage(self, obj):
        share_count = obj.art_share.count()
        return round((share_count / 100) * 100, 2)

    def get_art_view_count(self, obj):
        total_views = obj.views.aggregate(total_count=Coalesce(Sum("count"), 0))[
            "total_count"
        ]
        return total_views


class JoinOrgChallengeSerializers(serializers.ModelSerializer):
    organization_challenge = serializers.SlugRelatedField(
        queryset=OrganizationChallenge.objects.all(), required=False, slug_field="id"
    )

    class Meta:
        model = OrganizationChallengeParticipant
        fields = "__all__"


class DiscussionSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()
    views_count = serializers.IntegerField(read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = UserDiscussion
        fields = [
            "id",
            "title",
            "category",
            "description",
            "created_by",
            "time_ago",
            "views_count",
            "replies_count",
            "created_at",
        ]

    def get_created_by(self, obj):
        if obj.user:
            print(obj.user)
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return None

    def get_time_ago(self, obj):
        return timesince(obj.created_at) + " ago"

    def get_replies_count(self, obj):
        return obj.replies.count()


class UserBoardSerializer(serializers.ModelSerializer):
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = UserBoard
        fields = "__all__"

    def get_total_items(self, obj):
        return obj.board_fav_collection.count()


class UserBoardCollectionSerializers(serializers.ModelSerializer):
    board_collection = serializers.SlugRelatedField(
        queryset=UserBoard.objects.all(), required=False, slug_field="id"
    )
    art = serializers.SlugRelatedField(
        queryset=Art.objects.all(), required=False, slug_field="id"
    )

    class Meta:
        model = UserBoardCollection
        fields = "__all__"

    def validate(self, attrs):
        user = self.context["request"].user
        board_collection = attrs.get("board_collection")
        art = attrs.get("art")

        if UserBoardCollection.objects.filter(
            user=user, board_collection=board_collection, art=art
        ).exists():
            raise serializers.ValidationError(
                "This art is already added to the selected board."
            )

        return attrs


class BoardCollectionsSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserBoardCollection
        fields = "__all__"
        depth = 1


class BuyerOfferListSerializer(serializers.ModelSerializer):
    artist_first_name = serializers.CharField(
        source="art.artist.first_name", read_only=True
    )
    artist_last_name = serializers.CharField(
        source="art.artist.last_name", read_only=True
    )
    artist_profile_image = serializers.ImageField(
        source="art.artist.profile_image", read_only=True
    )

    art_id = serializers.IntegerField(source="art.id", read_only=True)
    art_title = serializers.CharField(source="art.title", read_only=True)
    art_price = serializers.IntegerField(source="art.price", read_only=True)
    art_message = serializers.CharField(source="art.description", read_only=True)

    expiry_date = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = BuyerOffers
        fields = [
            "id",
            "artist_first_name",
            "artist_last_name",
            "artist_profile_image",
            "expiry_date",
            "art_message",
            "status",
            "amount",
            "art_price",
            "is_expired",
            "created_at",
            "is_rejected",
            "art_id",
            "art_title",
            "reason",
        ]

    def get_expiry_date(self, obj):
        return obj.created_at + timedelta(days=7)

    def get_is_expired(self, obj):
        return timezone.now() > (obj.created_at + timedelta(days=7))

    def get_status(self, obj):
        if obj.is_rejected:
            return "Rejected"
        if obj.is_accepted:
            return "Accepted"
        return "Pending"


class RejectOfferSerializer(serializers.Serializer):
    offer_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=True)

    def validate_offer_id(self, value):
        try:
            offer = BuyerOffers.objects.get(id=value)
        except BuyerOffers.DoesNotExist:
            raise serializers.ValidationError("Offer not found.")

        if offer.is_accepted:
            raise serializers.ValidationError("Accepted offer cannot be rejected.")

        if offer.is_rejected:
            raise serializers.ValidationError("Offer is already rejected.")

        return value


class CounterOfferSerializer(serializers.ModelSerializer):
    art = serializers.SlugRelatedField(
        queryset=Art.objects.all(), slug_field="id", required=True
    )
    amount = serializers.IntegerField(required=True)
    expired_date = serializers.DateField(required=True)
    reason = serializers.CharField(required=False)

    class Meta:
        model = BuyerCounterOffers
        fields = ["id", "amount", "expired_date", "art", "reason", "user"]


class ArtSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = "__all__"

class TransactionHistorySerializer(serializers.ModelSerializer):
    created_at = serializers.SerializerMethodField(method_name="get_created_at")

    class Meta:
        model = PaymentTransaction
        fields = ['id', 'transactions_type', 'amount', 'created_at']

    def get_created_at(self, obj):
        return obj.order.created_at
