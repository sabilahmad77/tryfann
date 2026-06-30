from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("users/", include("fann.users.urls")),
        path("api/notifications/", include("fann.notifications.urls")),
        path("api/chat/", include("fann.chat.urls")),
        path("api/buyer/", include("fann.buyer.urls")),
        path("api/artist/", include("fann.artist.urls")),
        path("api/analysis/", include("fann.analysisai.urls")),
        path("api/market_final/", include("fann.market_final.urls")),
    ]
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
)
