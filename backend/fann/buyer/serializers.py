import datetime
from datetime import timedelta

from django.db.models import Case, When, Value, IntegerField, F, ExpressionWrapper

from django.db import models, transaction
from rest_framework import serializers

from fann.artist.models import (
    Auction,
    AuctionBid,
    Art,
    ArtOwner,
    Order,
    PaymentTransaction,
    ArtComment,
    ArtReviews,
    ArtWishList,
    ArtViewCount,
    OrderDispute,
    DisputeDocuments,
    DisputeConversation,
    DisputeMessage,
    ArtistFollow,
    ArtGallery,
    Payout,
    OrderLabel,
    Event,
    BuyerRSVP,
    BuyerOffers,
)
from fann.artist.serializers import ArtDetailSerializer
from fann.buyer.models import BuyerAddress, UserPost, PaymentMethods
from fann.users.models import User


class BuyerAuctionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auction
        fields = "__all__"


class BuyerPlaceBidSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionBid
        fields = "__all__"

    def create(self, validated_data):
        last_bid = (
            AuctionBid.objects.filter(id=validated_data["auction"].id)
            .order_by("-created_at")
            .first()
        )
        if last_bid:
            if last_bid.amount >= validated_data["amount"]:
                raise serializers.ValidationError(
                    "Bid amount should be higher than last bid"
                )
        if validated_data["amount"] < validated_data["auction"].starting_bid:
            raise serializers.ValidationError(
                "Bid amount should be higher than auction starting_price"
            )
        bid = AuctionBid.objects.create(**validated_data)
        return bid


class UserDetailSerializerBuyer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "bio"]


class BuyerArtMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = (
            "id",
            "title",
            "image",
            "price",
            "artist",
            "category",
            "medium",
            "art_tags",
            "art_type",
            "currency",
        )  # keep it light


class ArtGallerySerializer(serializers.ModelSerializer):

    class Meta:
        model = ArtGallery
        fields = "__all__"


class BuyerArtSerializer(serializers.ModelSerializer):
    wishlist = serializers.SerializerMethodField(method_name="get_wishlist")
    artist = UserDetailSerializerBuyer()
    galleries = serializers.SerializerMethodField(method_name="get_galleries")
    likes = serializers.SerializerMethodField(method_name="get_likes")
    views = serializers.SerializerMethodField(method_name="get_views")
    similar_arts = serializers.SerializerMethodField(method_name="get_similar_arts")
    is_follow = serializers.SerializerMethodField(method_name="get_is_follow")
    auction = serializers.SerializerMethodField(method_name="get_auction")

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

    def get_galleries(self, obj):
        gallery = ArtGallery.objects.filter(art=obj)
        return ArtGallerySerializer(gallery, many=True).data

    def get_is_follow(self, obj):
        request = self.context["request"]
        follow = ArtistFollow.objects.filter(
            artist=obj.artist, follower=request.user
        ).exists()
        return follow

    def get_similar_arts(self, obj):
        # Base pool: unsold, not self
        qs = Art.objects.filter(is_sold=False).exclude(id=obj.id)

        # Same-artist & same-category boolean flags
        same_artist = Case(
            When(artist=obj.artist, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
        same_category = Case(
            When(category=obj.category, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )

        # Build tag-hit sum: +1 for each matching tag (icontains on JSON text)
        tag_hits_expr = Value(0, output_field=IntegerField())
        # tags = (obj.art_tags or [])[:8]  # cap how many tags we check
        raw_tags = obj.art_tags
        if isinstance(raw_tags, list):
            tags = raw_tags[:8]
        else:
            tags = []
        for tag in tags:
            if isinstance(tag, str) and tag.strip():
                tag_hits_expr = ExpressionWrapper(
                    tag_hits_expr
                    + Case(
                        When(art_tags__icontains=tag.strip(), then=Value(1)),
                        default=Value(0),
                        output_field=IntegerField(),
                    ),
                    output_field=IntegerField(),
                )

        qs = (
            qs.annotate(
                tag_hits=tag_hits_expr,
            )
            .annotate(
                # cap tag hits at 3
                tag_hits_capped=Case(
                    When(tag_hits__gt=3, then=Value(3)),
                    default=F("tag_hits"),
                    output_field=IntegerField(),
                ),
                # final similarity score
                sim_score=(3 * same_artist + 2 * same_category + F("tag_hits_capped")),
            )
            .order_by("-sim_score", "-created_at")[:3]
        )

        return BuyerArtMiniSerializer(qs, many=True, context=self.context).data

    def get_wishlist(self, obj):
        user = self.context["request"].user
        wishlist = ArtWishList.objects.filter(user=user, art=obj)
        if wishlist:
            return True
        return False

    def get_likes(self, obj):
        likes = ArtWishList.objects.filter(art=obj).count()
        return likes

    def get_views(self, obj):
        views = ArtViewCount.objects.filter(art=obj).first()
        if views:
            return views.count
        return 0


class BuyArtSerializer(serializers.Serializer):
    art = serializers.IntegerField()
    fraction = serializers.IntegerField()
    # sale_id = serializers.CharField(required=True, write_only=True)

    def create(self, validated_data):
        art_id = validated_data["art"]
        user = self.context["request"].user
        art = Art.objects.filter(id=art_id).first()  # noqa
        if not art:
            raise serializers.ValidationError("Art does not exist")
        shipping_cost = 2
        tax_amount = 2
        platform_fee = 3
        with transaction.atomic():
            fractions = validated_data["fraction"]
            if art.art_type == "Fractional":
                if art.remaining_fractions < fractions:
                    raise serializers.ValidationError("No enough factions remaining")
                owner = ArtOwner.objects.filter(art=art, owner=user).first()
                if owner:
                    owner.factions += fractions
                    owner.save()
                else:
                    ArtOwner.objects.create(art=art, owner=user, factions=fractions)
                art.remaining_fractions -= fractions
                single_fraction_price = art.price / art.no_of_fraction
                price = round(single_fraction_price * fractions, 3)
                art.save()
            else:
                if art.is_sold:
                    raise serializers.ValidationError("Art already sold")
                ArtOwner.objects.create(art=art, owner=user, factions=fractions)
                price = art.price
                art.is_sold = True
                art.save()
            order = Order.objects.create(
                buyer=user,
                art=art,
                # sale_id=validated_data["sale_id"],
                artist=art.artist,
                status="Pending",
                # currency=validated_data['currency'],
                no_of_fractions=fractions,
                shipping_cost=shipping_cost,
                tax_amount=tax_amount,
                platform_fee=platform_fee,
                discount_total=0,
                total=price + shipping_cost + tax_amount + platform_fee,
                payment_status="Captured",
                paid_at=datetime.datetime.now(),
                fulfilled_at=datetime.datetime.now(),
                eta=datetime.datetime.now() + datetime.timedelta(days=15),
            )
            PaymentTransaction.objects.create(
                order=order,
                # gateway=validated_data['currency'],
                amount=order.total,
                # currency=validated_data['currency'],
                status="Captured",
            )
            Payout.objects.create(
                order=order,
                art=art,
                artist=art.artist,
                scheduled_for=datetime.datetime.now() + datetime.timedelta(days=15),
                amount=price,
            )
        return order


class ArtCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtComment
        fields = "__all__"

    # def validate(self, data):
    #     art_id = data['art']
    #     user = self.context['request'].user
    #     previous_comment = ArtComment.objects.filter(art=art_id, user=user).order_by('-created_at').first()
    #     if previous_comment:
    #         raise serializers.ValidationError("Art comments already exist")
    #     return data


class ArtReviewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtReviews
        fields = "__all__"

    # def validate(self, data):
    #     art_id = data['art']
    #     user = self.context['request'].user
    #     previous_comment = ArtReviews.objects.filter(art=art_id, user=user).order_by('-created_at').first()
    #     if previous_comment:
    #         raise serializers.ValidationError("Art review already exist")
    #     return data


class AuctionDetailsSerializer(serializers.ModelSerializer):
    bid_details = serializers.SerializerMethodField(method_name="get_bid_details")

    class Meta:
        model = Auction
        fields = "__all__"

    def get_bid_details(self, obj):
        user = self.context["request"].user
        minimum_bid = 0
        bids = AuctionBid.objects.filter(auction=obj).order_by("-amount")
        if bids:
            minimum_bid = bids.first().amount
        bidder_count = bids.count()
        my_bid = 0
        user_bids = bids.filter(bidder=user).order_by("-amount").first()
        if user_bids:
            my_bid = user_bids.amount
        return {
            "my_bid": my_bid,
            "minimum_bid": minimum_bid,
            "bidder_count": bidder_count,
        }


class AuctionBidSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField(method_name="get_user")

    class Meta:
        model = AuctionBid
        fields = "__all__"

    def get_user(self, obj):
        return f"{obj.bidder.first_name} {obj.bidder.last_name}"


class ArtistDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]


class BuyerCollectionSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField(method_name="get_owner")
    likes = serializers.SerializerMethodField(method_name="get_likes")
    views = serializers.SerializerMethodField(method_name="get_views")
    artist = ArtistDetailSerializer()

    class Meta:
        model = Art
        fields = "__all__"

    def get_owner(self, obj):
        request = self.context["request"]
        owner = ArtOwner.objects.filter(owner=request.user, art=obj).last()
        if owner:
            return {"id": owner.id, "owned_fractions": owner.factions}
        return None

    def get_likes(self, obj):
        likes = ArtWishList.objects.filter(art=obj).count()
        return likes

    def get_views(self, obj):
        views = ArtViewCount.objects.filter(art=obj).first()
        if views:
            return views.count
        return 0


class ArtOrderDetail(serializers.ModelSerializer):
    class Meta:
        model = Art
        fields = "__all__"


class BuyerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]


class BuyerOrderSerializer(serializers.ModelSerializer):
    art = ArtOrderDetail()
    labels = serializers.SerializerMethodField(method_name="get_labels")
    buyer = BuyerDetailSerializer()

    class Meta:
        model = Order
        fields = "__all__"

    def get_labels(self, obj):
        label = OrderLabel.objects.filter(order=obj).first()
        if label:
            return label.label
        return None


class BuyerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerAddress
        fields = "__all__"


class BuyerPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPost
        fields = "__all__"


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email"]


class BuyerDisputeListingSerializer(serializers.ModelSerializer):
    buyer = UserDetailSerializer()
    seller = UserDetailSerializer()
    documents = serializers.SerializerMethodField(method_name="get_documents")
    sale_id = serializers.SerializerMethodField(method_name="get_sale_id")
    art = serializers.SerializerMethodField(method_name="get_art")
    auction_id = serializers.SerializerMethodField(method_name="get_auction_id")

    class Meta:
        model = OrderDispute
        fields = "__all__"

    def get_documents(self, obj):
        documents = DisputeDocuments.objects.filter(dispute=obj)
        if documents:
            response = []
            for document in documents:
                response.append(document.file.url)
            return response
        return None

    def get_sale_id(self, obj):
        try:
            return obj.order.art.sale_id
        except:
            return None

    def get_art(self, obj):
        return ArtOrderDetail(obj.order.art).data

    def get_auction_id(self, obj):
        auction = Auction.objects.filter(art=obj.order.art).last()
        if auction:
            return auction.auction_id
        return None


class DisputeConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeConversation
        fields = [
            "id",
            "dispute",
            "party",
            "party_role",
            "admin",
            "is_open",
            "last_message_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "last_message_at"]


class DisputeMessageReadSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)

    class Meta:
        model = DisputeMessage
        fields = [
            "id",
            "conversation",
            "sender",
            "sender_name",
            "message",
            "created_at",
        ]


class DisputeMessageCreateSerializer(serializers.ModelSerializer):
    # client passes conversation OR routing hints (party/role/dispute) depending on role
    class Meta:
        model = DisputeMessage
        fields = ["conversation", "message"]


class PaymentMethodsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethods
        fields = "__all__"


class BuyerEventListingSerializer(serializers.ModelSerializer):
    already_rsvp = serializers.SerializerMethodField(method_name="get_already_rsvp")
    arts = ArtDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = "__all__"

    def get_already_rsvp(self, obj):
        request = self.context["request"]
        rsvp = BuyerRSVP.objects.filter(user=request.user).exists()
        return rsvp


class BuyerRsvpSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuyerRSVP
        fields = "__all__"

    def create(self, validated_data):
        request = self.context["request"]
        previous_rsvp = BuyerRSVP.objects.filter(user=request.user).first()
        if previous_rsvp:
            raise serializers.ValidationError("RSVP already exists")
        count_rsvp = BuyerRSVP.objects.filter(event=validated_data["event"]).count()
        if count_rsvp >= validated_data["event"].max_participants:
            raise serializers.ValidationError("Max participants reached")
        rsvp = BuyerRSVP.objects.create(**validated_data)
        return rsvp


class BuyerOfferCreateSerializer(serializers.ModelSerializer):
    is_accepted = serializers.BooleanField(read_only=True)

    class Meta:
        model = BuyerOffers
        fields = ["id", "art", "buyer", "amount", "is_accepted"]
        read_only_fields = ["id", "is_accepted"]

    def validate(self, attrs):
        art = attrs.get("art")
        buyer = attrs.get("buyer")
        amount = attrs.get("amount")

        if art is None or buyer is None or amount is None:
            return attrs

        if not art.art_type == "Offers":
            raise serializers.ValidationError(
                {"non_field_errors": ["Art type should be offer"]}
            )

        if BuyerOffers.objects.filter(art=art, is_accepted=True).exists():
            raise serializers.ValidationError(
                {
                    "non_field_errors": [
                        "An offer for this artwork has already been accepted."
                    ]
                }
            )
        previous_offer = (
            BuyerOffers.objects.filter(art=art, buyer=buyer).order_by("-id").first()
        )

        if previous_offer is None:
            if amount < art.price:
                raise serializers.ValidationError(
                    {
                        "amount": f"Your first offer must be at least the listing price ({art.price})."
                    }
                )
        else:
            if amount <= previous_offer.amount:
                raise serializers.ValidationError(
                    {
                        "amount": (
                            f"Your new offer ({amount}) must be greater than your previous "
                            f"offer ({previous_offer.amount})."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        return super().create(validated_data)
