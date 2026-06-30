from rest_framework import serializers
from .models import PaintingAnalysis


class PaintingAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaintingAnalysis
        fields = "__all__"
        read_only_fields = (
            "id",
            "predicted_authenticity",
            "confidence_score",
            "analysis_timestamp",
        )


class PaintingUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    artist_name = serializers.CharField(max_length=200, required=False)
    artwork_title = serializers.CharField(max_length=300, required=False)


class PaintingPredictionSerializer(serializers.Serializer):
    """Serializer for painting price prediction input"""

    Name_of_Painter = serializers.CharField(
        max_length=100, help_text="Name of the painter (e.g., Vincent van Gogh)"
    )
    Subject_of_Painting = serializers.CharField(
        max_length=100,
        help_text="Subject of the painting (e.g., Landscape, Portrait, Abstract)",
    )
    Style = serializers.CharField(
        max_length=100, help_text="Art style (e.g., Post-Impressionism, Modern, Cubism)"
    )
    Medium = serializers.CharField(
        max_length=50, help_text="Medium used (e.g., Oil, Watercolor, Acrylic)"
    )
    Size = serializers.CharField(
        max_length=20, help_text='Painting size (e.g., 24x36, 18"x24")'
    )
    Frame = serializers.CharField(
        max_length=20, help_text="Frame type (e.g., Yes, No, Wooden)"
    )
    Location = serializers.CharField(
        max_length=50, help_text="Location (e.g., Gallery, Chicago, Miami)"
    )
    Delivery_days = serializers.IntegerField(
        min_value=1, max_value=365, help_text="Delivery time in days"
    )
    Shipment = serializers.CharField(
        max_length=50,
        help_text="Shipment type (e.g., International, Standard, Free Shipping)",
    )
    Color_Palette = serializers.CharField(
        max_length=50, help_text="Color palette (e.g., Warm, Cool Tones, Neutral Tones)"
    )
    Copy_or_Original = serializers.CharField(
        max_length=20, help_text="Type (e.g., Original, Copy)"
    )
    Print_or_Real = serializers.CharField(
        max_length=20, help_text="Format (e.g., Real, Print)"
    )
    Recommended_Environment = serializers.CharField(
        max_length=50,
        help_text="Recommended environment (e.g., Living Room, Office, Bedroom)",
    )
    Mood_Atmosphere = serializers.CharField(
        max_length=50, help_text="Mood/Atmosphere (e.g., Vibrant, Calming, Energetic)"
    )
    Theme_Lighting_Requirements = serializers.CharField(
        max_length=50, help_text="Lighting requirements (e.g., Bright, Natural Light)"
    )
    Reproduction_Type = serializers.CharField(
        max_length=50,
        help_text="Reproduction type (e.g., None, Lithograph, Screen Print)",
    )
    Target_Audience = serializers.CharField(
        max_length=50, help_text="Target audience (e.g., Collectors, Corporate Clients)"
    )


class PaintingPredictionResponseSerializer(serializers.Serializer):
    """Serializer for prediction response"""

    predicted_price = serializers.FloatField(help_text="Predicted price in USD")
    input_data = PaintingPredictionSerializer(help_text="Echo of input data")
    model_version = serializers.CharField(help_text="Model version info")
    timestamp = serializers.DateTimeField(help_text="Prediction timestamp")
