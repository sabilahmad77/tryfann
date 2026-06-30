from django.contrib import admin

from fann.market_final.models import (
    Region,
    ReferralClick,
    WatchEarn,
    UserWatchEarn,
    Redemption,
    UserRedemption,
    UserSettings,
    Progression,
    ArtistRoaster,
    ArtworkCollection,
    InstagramFollowers,
    TwitterFollowers,
    YoutubeSubscribers,
    TikTokFollowers,
    PrimaryPlatform,
    PuzzleCompletion,
    ArtworkArtistCollection,
    PriceRange,
    UserFeedBack,
    UserFollower, UserReportBug,
)
from fann.users.models import IntersetReward

# Register your models here.
admin.site.register(Region)
admin.site.register(ReferralClick)
admin.site.register(WatchEarn)
admin.site.register(UserWatchEarn)
admin.site.register(Redemption)
admin.site.register(UserRedemption)
admin.site.register(UserSettings)
admin.site.register(Progression)
admin.site.register(ArtistRoaster)
admin.site.register(ArtworkCollection)
admin.site.register(InstagramFollowers)
admin.site.register(TwitterFollowers)
admin.site.register(YoutubeSubscribers)
admin.site.register(TikTokFollowers)
admin.site.register(PrimaryPlatform)
admin.site.register(PuzzleCompletion)
admin.site.register(ArtworkArtistCollection)
admin.site.register(PriceRange)
admin.site.register(UserFeedBack)
admin.site.register(UserFollower)
admin.site.register(UserReportBug)
admin.site.register(IntersetReward)
