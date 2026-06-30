from django.urls import path, include
from rest_framework.routers import DefaultRouter

from fann.artist.market_place_views import (
    SliderTopArtsView,
    MarketPlaceAllArtView,
    EmergingArtistView,
    ArtCountByCategory,
    ArtRetireveMarketPlaceView,
    ArtPricingView,
    LiveAuctionView,
    ArtistShopGetView,
    RealWorldArtView,
    FamousArtistView,
    ParticularArtistView,
    FractionalArtistView,
)
from fann.artist.views import (
    ArtViewSet,
    ArtCommentsListing,
    AuctionBidingView,
    ArtNewSaleView,
    ArtistStatsView,
    AuctionView,
    AuctionBidView,
    ArtRetireveView,
    ArtAuctionViewSet,
    ArtistListingDetail,
    ArtistListingBuyerDetail,
    OrganizationArtistListing,
    OrganizationRecentArts,
    ArtistShopView,
    ArtistOrdersView,
    UpdateOrderStatus,
    ArtistDetailsView,
    ArtistPortFolioView,
    ArtistProfilePublicView,
    ArtistFollowView,
    GenerateOrderLabelView,
    SellerOrderStatsView,
    ShareArtView,
    UpdateArtGalleryView,
    ArtistDetailsGenericView,
    SalesEarningStatsView,
    PrimarySalesView,
    ArtistPayoutView,
    ArtistPayoutHistoryView,
    TopPerformanceArtView,
    ArtRevenueBreakDownView,
    FraudDetectionArt,
    ChallengeView,
    EventsView,
    ArtOfferListingView,
    AcceptOfferView,
    ChallengeGETListView,
    JoinOrgChallengeView,
    DiscussionViewSet,
    BoardFavoriteViewSet,
    DiscussionTopicsView,
    TrendingTopicsView,
    OffersListingGetView,
    RejectOfferView,
    CounterOfferView,
    CounterOffersListingGetView,
    ArtworkSearchView, FinalizeAuctionView, TransactionsHistoryView,
)

router = DefaultRouter()
router.register("discussion", DiscussionViewSet, basename="discussion")
router.register("board_favorite", BoardFavoriteViewSet, basename="board_favorite")
urlpatterns = [
    path("", include(router.urls)),
    path("create_fixed_art", ArtViewSet.as_view(), name="create_art"),
    path("create_auction_art", ArtAuctionViewSet.as_view(), name="create_auction_art"),
    path("list_art", ArtViewSet.as_view(), name="list_art"),
    path("update_art/<int:pk>/", ArtViewSet.as_view(), name="update_art"),
    path("get_art/<int:pk>/", ArtRetireveView.as_view(), name="update_art"),
    path("delete_art/<int:pk>/", ArtViewSet.as_view(), name="delete_art"),
    # Art Comments
    path("art_comments", ArtCommentsListing.as_view(), name="art_comments"),
    # Art Bids
    path("auction_bids", AuctionBidingView.as_view(), name="auction_bids"),
    path("new_sale", ArtNewSaleView.as_view(), name="new_sale"),
    path("artist_stats", ArtistStatsView.as_view(), name="new_sale"),
    # Auction
    path("create_auction", AuctionView.as_view(), name="create_auction"),
    path("auction_listing", AuctionView.as_view(), name="auction_listing"),
    path("acution_bids", AuctionBidView.as_view(), name="auction_listing"),
    path("finalize_auction/<int:pk>/", FinalizeAuctionView.as_view(), name="auction_listing"),
    # Artist Listing
    path("artist_listing", ArtistListingDetail.as_view(), name="artist_listing"),
    path(
        "artist_listing_buyer",
        ArtistListingBuyerDetail.as_view(),
        name="artist_listing",
    ),
    # Organization
    path(
        "organization_artist",
        OrganizationArtistListing.as_view(),
        name="artist_listing",
    ),
    path("recents_arts", OrganizationRecentArts.as_view(), name="recents_arts"),
    # MarketPlace
    path("top_slider_arts/", SliderTopArtsView.as_view(), name="top_slider_arts"),
    path("view_all_arts/", MarketPlaceAllArtView.as_view(), name="top_slider_arts"),
    path("artist_details", ArtistDetailsView.as_view(), name="artist_detais"),
    path(
        "artist_details_generic/<int:pk>/",
        ArtistDetailsGenericView.as_view(),
        name="artist_detais",
    ),
    path("emerging_artist/", EmergingArtistView.as_view(), name="emerging_artist"),
    path(
        "art_count_by_category/", ArtCountByCategory.as_view(), name="emerging_artist"
    ),
    path(
        "get_art_marketplace/<int:pk>/",
        ArtRetireveMarketPlaceView.as_view(),
        name="update_art",
    ),
    # Shop
    path("add_shop/", ArtistShopView.as_view(), name="top_slider_arts"),
    path("update_shop/<int:pk>/", ArtistShopView.as_view(), name="top_slider_arts"),
    path("shop_listing/", ArtistShopView.as_view(), name="top_slider_arts"),
    path("delete_shop/<int:pk>/", ArtistShopView.as_view(), name="top_slider_arts"),
    # Orders
    path("orders/", ArtistOrdersView.as_view(), name="orders"),
    path("update_order/", UpdateOrderStatus.as_view(), name="orders"),
    path("generate_label/", GenerateOrderLabelView.as_view(), name="orders"),
    path("seller_orders_stats/", SellerOrderStatsView.as_view(), name="orders"),
    # Artist
    path("update_artist_profile", ArtistDetailsView.as_view(), name="artist_detais"),
    path("add_portfolio", ArtistPortFolioView.as_view(), name="artist_detais"),
    path(
        "update_portfolio/<int:pk>/",
        ArtistPortFolioView.as_view(),
        name="artist_detais",
    ),
    path(
        "delete_portfolio/<int:pk>/",
        ArtistPortFolioView.as_view(),
        name="artist_detais",
    ),
    path(
        "artist_public_detail/<int:pk>/",
        ArtistProfilePublicView.as_view(),
        name="artist_detais",
    ),
    path("follow_artist/", ArtistFollowView.as_view(), name="follow_artist"),
    path("share_art/", ShareArtView.as_view(), name="share_art"),
    # Gallery
    path(
        "add_gallery_image/", UpdateArtGalleryView.as_view(), name="add_gallery_image"
    ),
    path(
        "gallery_listing/<int:pk>/",
        UpdateArtGalleryView.as_view(),
        name="add_gallery_image",
    ),
    path(
        "delete_gallery_image/<int:pk>/",
        UpdateArtGalleryView.as_view(),
        name="delete_gallery_image",
    ),
    # Sales & Earnings
    path(
        "sales_earning_stats/",
        SalesEarningStatsView.as_view(),
        name="sales_earning_stats",
    ),
    path("primary_sales/", PrimarySalesView.as_view(), name="primary_sales"),
    path("pending_payout/", ArtistPayoutView.as_view(), name="primary_sales"),
    path("payout_history/", ArtistPayoutHistoryView.as_view(), name="primary_sales"),
    path("top_performance_art/", TopPerformanceArtView.as_view(), name="primary_sales"),
    path("revenue_breakdown/", ArtRevenueBreakDownView.as_view(), name="primary_sales"),
    # Fraud Detection
    path("fraud_detection/", FraudDetectionArt.as_view(), name="fraud_detection"),
    # Challenge
    path("add_challenge/", ChallengeView.as_view(), name="add_challenge"),
    path("challenge_listing/", ChallengeView.as_view(), name="add_challenge"),
    # Events
    path("add_event/", EventsView.as_view(), name="add_event"),
    path("event_listing/", EventsView.as_view(), name="art_listing"),
    # Offers
    path("art_offers/<int:pk>/", ArtOfferListingView.as_view(), name="art_offers"),
    path("accept_offer/", AcceptOfferView.as_view(), name="art_offers"),
    path("art_pricing/", ArtPricingView.as_view(), name="art_pricing"),
    path("live_auction/", LiveAuctionView.as_view(), name="live_auction"),
    path("artist_shop/", ArtistShopGetView.as_view(), name="artist_shop"),
    path("real_world_art/", RealWorldArtView.as_view(), name="real_world_art"),
    path("famous_artist/", FamousArtistView.as_view(), name="famous_artist"),
    path(
        "particular_artist/", ParticularArtistView.as_view(), name="particular_artist"
    ),
    path(
        "fractional_artist/", FractionalArtistView.as_view(), name="fractional_artist"
    ),
    path(
        "fractional_artist/<int:pk>/",
        FractionalArtistView.as_view(),
        name="fractional_artist_id",
    ),
    path(
        "challenge_get_listing/",
        ChallengeGETListView.as_view(),
        name="challenge_get_listing",
    ),
    path(
        "join_org_challenge/", JoinOrgChallengeView.as_view(), name="join_org_challenge"
    ),
    path(
        "add_art_board_fav/",
        BoardFavoriteViewSet.as_view({"post": "add_art_board_favorite"}),
        name="add_art_board_fav",
    ),
    path(
        "board_collection/",
        BoardFavoriteViewSet.as_view({"get": "board_collection"}),
        name="board_collection",
    ),
    path(
        "discussion_topics/", DiscussionTopicsView.as_view(), name="discussion_topics"
    ),
    path("trending_topics/", TrendingTopicsView.as_view(), name="trending_topics"),
    path("offers_listing/", OffersListingGetView.as_view(), name="offers_listing"),
    path("reject_offer/", RejectOfferView.as_view(), name="reject_offer"),
    path("counter_offer/", CounterOfferView.as_view(), name="counter_offer"),
    path(
        "counter_offer_listing/<int:art_id>/",
        CounterOffersListingGetView.as_view(),
        name="counter_offer_listing",
    ),
    path("artwork-search/", ArtworkSearchView.as_view(), name="artwork-search"),

    # Transaction
    path('transaction_history/', TransactionsHistoryView.as_view(), name='transaction_history'),
]
