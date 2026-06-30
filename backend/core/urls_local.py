"""
Local-only URLconf for the TryFann funnel.

Includes ONLY admin + the market_final API. Deliberately omits the users/,
buyer/, artist/, chat/, notifications/ and analysis/ includes from core.urls
so their view modules (which import web3 / torch / tensorflow) never load.
The frontend's funnel endpoints all live under /api/market_final/*.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    """Liveness probe for the backend host (Render/Railway/Fly health checks)."""
    return JsonResponse({"status": "ok", "service": "trifan-api"})


urlpatterns = (
    [
        path("health", health, name="health"),
        path("api/health", health, name="api-health"),
        path("admin/", admin.site.urls),
        path("api/market_final/", include("fann.market_final.urls")),
        path("api/qualification/", include("fann.qualification.urls")),
    ]
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
)
