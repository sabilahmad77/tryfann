from django.urls import path

from fann.buyer.moon_pay_apis import sign_widget_url, moonpay_webhook
from fann.buyer.views import (
    BuyerPlaceBidView,
    BuyerActiveArtsView,
    BuyArtView,
    BuyerCommentView,
    BuyerArtReviewView,
    AuctionRetrieveView,
    AuctionBidView,
    AuctionBuyerView,
    ArtDetailView,
    PurchasedArtView,
    BuyerArtCollectionStats,
    AddWishListView,
    CollectionArtViewsCountView,
    BuyerOrdersView,
    OrderStatsView,
    BuyerAddressView,
    BuyerPostView,
    BuyerPostStatsView,
    MarkOrderCompleted,
    FileDisputeView,
    OrderDisputeView,
    AdminOrderDispute,
    DisputeDecisionView,
    PartyChatList,
    AdminChatList,
    PaymentMethodView,
    BuyerEventListing,
    BuyerRSVPView,
    PlaceOfferAPI,
    BuyerPostGetView, BuyerOfferListing,
)

urlpatterns = [
    # path("buyer_auction/", BuyerAuctionView.as_view(), name="buyer_auction"),
    path("place_bid/", BuyerPlaceBidView.as_view(), name="place_bid"),
    path("buyer_arts_listing/", BuyerActiveArtsView.as_view(), name="place_bid"),
    path("art_details/<int:pk>/", ArtDetailView.as_view(), name="place_bid"),
    path("buy_art/", BuyArtView.as_view(), name="buy_art"),
    path("add_comment/", BuyerCommentView.as_view(), name="add_comment"),
    path("update_comment/<int:pk>", BuyerCommentView.as_view(), name="add_comment"),
    path("delete_comment/<int:pk>", BuyerCommentView.as_view(), name="add_comment"),
    path("add_review/", BuyerArtReviewView.as_view(), name="add_review"),
    path("review_listing/", BuyerArtReviewView.as_view(), name="add_review"),
    path("update_review/<int:pk>", BuyerArtReviewView.as_view(), name="add_review"),
    path("delete_review/<int:pk>", BuyerArtReviewView.as_view(), name="add_review"),
    path("auction_details/<int:pk>", AuctionRetrieveView.as_view(), name="add_review"),
    path("bid_details/<int:pk>", AuctionBidView.as_view(), name="add_review"),
    path("buyer_auction", AuctionBuyerView.as_view(), name="add_review"),
    # Moon Pay Integration
    path("sign_url", sign_widget_url),
    path("moonpay_webhook", moonpay_webhook),
    # Collections
    path("collections/", PurchasedArtView.as_view(), name="collections"),
    path(
        "collection_stats/", BuyerArtCollectionStats.as_view(), name="collection_stats"
    ),
    path(
        "collection_views_count/",
        CollectionArtViewsCountView.as_view(),
        name="collection_views",
    ),
    # WishList
    path("wishlist/", AddWishListView.as_view(), name="wishlist"),
    # Orders
    path("orders/", BuyerOrdersView.as_view()),
    path("order_stats/", OrderStatsView.as_view(), name="order_stats"),
    # Buyer Address
    path("address_listing/", BuyerAddressView.as_view(), name="address_listing"),
    path("add_location/", BuyerAddressView.as_view(), name="add_location"),
    path(
        "update_location/<int:pk>/", BuyerAddressView.as_view(), name="address_listing"
    ),
    # Posts
    path("add_post/", BuyerPostView.as_view(), name="add_post"),
    path("update_post/<int:pk>", BuyerPostView.as_view(), name="update_post"),
    path("post_listing/", BuyerPostView.as_view(), name="post_listing"),
    path("post_stats/", BuyerPostStatsView.as_view(), name="post_listing"),
    # Orders
    path(
        "mark_order_completed/",
        MarkOrderCompleted.as_view(),
        name="mark_order_completed",
    ),
    path("create_dispute/", FileDisputeView.as_view(), name="mark_order_completed"),
    path("dispute_listing/", OrderDisputeView.as_view(), name="mark_order_completed"),
    # Admin Disputes Management
    path(
        "admin_dispute_listing/",
        AdminOrderDispute.as_view(),
        name="mark_order_completed",
    ),
    path(
        "dispute_decision/", DisputeDecisionView.as_view(), name="mark_order_completed"
    ),
    # Users Chat
    path("chat_listing/", PartyChatList.as_view(), name="chat_listing"),
    path("send_message/", PartyChatList.as_view(), name="chat_listing"),
    # Admin Chats
    path("admin_chat_listing/", AdminChatList.as_view(), name="admin_chat_listing"),
    path("send_admin_message/", AdminChatList.as_view(), name="admin_chat_listing"),
    # Payment Methods
    path(
        "add_payment_methods/", PaymentMethodView.as_view(), name="add_payment_methods"
    ),
    path(
        "update_payment_method/<int:pk>/",
        PaymentMethodView.as_view(),
        name="update_payment_method",
    ),
    path(
        "payment_method_listing/",
        PaymentMethodView.as_view(),
        name="payment_method_listing",
    ),
    path(
        "delete_payment_methods/<int:pk>/",
        PaymentMethodView.as_view(),
        name="delete_payment_methods",
    ),
    # Events
    path("buyer_events/", BuyerEventListing.as_view(), name="buyer_events"),
    path("add_rsvp/", BuyerRSVPView.as_view(), name="add_rsvp"),
    # Offers
    path("place_offer", PlaceOfferAPI.as_view(), name="create_auction_art"),
    path("get_art_offer/<int:pk>/", BuyerOfferListing.as_view(), name="create_auction_art"),
    path("post_get_listing/", BuyerPostGetView.as_view(), name="post_get_listing"),
]
