# fann/art_auth/urls.py (create this file in your app directory)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaintingAnalysisViewSet, PaintingPricePredictionView

# Create router and register viewsets
router = DefaultRouter()
router.register(r"paintings", PaintingAnalysisViewSet, basename="painting-analysis")

urlpatterns = [
    # API endpoints with versioning
    path("v1/", include(router.urls)),
    path(
        "api/price-analysis/",
        PaintingPricePredictionView.as_view(),
        name="price-analysis",
    ),
]

# This will create the following endpoints:
# POST   /api/auth/v1/paintings/analyze/          - Analyze a painting
# GET    /api/auth/v1/paintings/                  - List all analyses
# GET    /api/auth/v1/paintings/{id}/             - Get specific analysis
# GET    /api/auth/v1/paintings/{id}/detailed_analysis/ - Detailed analysis
# PUT    /api/auth/v1/paintings/{id}/             - Update analysis
# DELETE /api/auth/v1/paintings/{id}/             - Delete analysis
