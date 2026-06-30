from django.conf import settings
import os
import joblib
import pandas as pd
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


from core import settings
from .ml_model import ArtAuthenticationModel
from .models import PaintingAnalysis
from .serializers import (
    PaintingAnalysisSerializer,
    PaintingUploadSerializer,
    PaintingPredictionSerializer,
)

import os
import tempfile
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import PaintingAnalysis
from .serializers import PaintingAnalysisSerializer, PaintingUploadSerializer
from ..artist.models import Art


class PaintingAnalysisViewSet(viewsets.ModelViewSet):
    queryset = PaintingAnalysis.objects.all()
    serializer_class = PaintingAnalysisSerializer
    parser_classes = (MultiPartParser, FormParser)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Initialize with your model path
        # Update this path to point to your actual model file
        # model_path = os.getenv('ART_MODEL_PATH', '.\model.h5')
        PROJECT_ROOT = settings.BASE_DIR  # Django sets this in settings.py

        # Path to model inside media folder
        model_path = os.path.join(PROJECT_ROOT, "media", "model.h5")
        print(model_path)
        try:
            self.ml_model = ArtAuthenticationModel(model_path=model_path)
        except Exception as e:
            print(f"Warning: Failed to load ML model: {e}")
            self.ml_model = None

    @action(detail=False, methods=["post"], url_path="analyze")
    def analyze_painting(self, request):
        """
        Analyze an uploaded painting image for AI vs Human authenticity.
        """
        if not self.ml_model:
            return Response(
                {"error": "ML model not available"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = PaintingUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data["image"]
        temp_file_path = None

        try:
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name

            # Analyze the image
            analysis_result = self.ml_model.predict_authenticity(temp_file_path)

            # Reset file pointer for permanent storage
            uploaded_file.seek(0)
            file_path = default_storage.save(
                f"paintings/{uploaded_file.name}", ContentFile(uploaded_file.read())
            )

            # Create database record
            painting_analysis = PaintingAnalysis.objects.create(
                image=file_path,
                predicted_authenticity=analysis_result["authenticity"],
                confidence_score=analysis_result["confidence"],
                artist_name=serializer.validated_data.get("artist_name"),
                artwork_title=serializer.validated_data.get("artwork_title"),
                # raw_prediction_data=analysis_result.get("raw_prediction"),
            )

            # Prepare response
            response_data = {
                "analysis_id": painting_analysis.id,
                "authenticity": analysis_result["authenticity"],
                "confidence": analysis_result["confidence"],
                "class_probabilities": analysis_result["class_probabilities"],
                "brushwork_analysis": analysis_result["brushwork_analysis"],
                "timestamp": painting_analysis.analysis_timestamp,
                "recommendations": self._get_recommendations(analysis_result),
                "model_info": {
                    "type": "AI Detection Model",
                    "classes": ["human_made", "ai_generated"],
                    "input_size": "256x256",
                },
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Analysis failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except OSError:
                    pass

    def _get_recommendations(self, analysis_result):
        """
        Provide recommendations based on AI detection analysis results.
        """
        authenticity = analysis_result["authenticity"]
        confidence = analysis_result["confidence"]

        if authenticity == "real" and confidence > 0.8:
            return [
                "High confidence this is human-created artwork",
                "Traditional artistic techniques detected",
                "Consider professional appraisal for historical value",
                "Ensure proper conservation conditions",
            ]
        elif authenticity == "fake" and confidence > 0.7:
            return [
                "Strong indicators of AI generation detected",
                "Digital artifacts and patterns suggest artificial creation",
                "Verify the source and intended use of this image",
                "Be cautious if purchasing as original artwork",
            ]
        elif authenticity == "uncertain":
            return [
                "Analysis inconclusive - borderline case detected",
                "May be heavily processed human artwork or sophisticated AI",
                "Recommend expert authentication",
                "Consider additional analysis methods",
                "Check for mixed media or digital enhancement",
            ]
        else:
            return [
                "Unexpected analysis result",
                "Recommend manual review",
                "Consider retesting with different image quality",
            ]

    @action(detail=True, methods=["get"])
    def detailed_analysis(self, request, pk=None):
        """
        Get detailed analysis for a specific painting with additional metrics.
        """
        try:
            painting = self.get_object()

            # Get the stored analysis
            serializer = self.get_serializer(painting)
            data = serializer.data

            # Add additional computed metrics if available
            if (
                hasattr(painting, "raw_prediction_data")
                and painting.raw_prediction_data
            ):
                data["raw_prediction"] = painting.raw_prediction_data

            # Add interpretation notes
            data["interpretation"] = self._get_detailed_interpretation(painting)

            return Response(data)

        except PaintingAnalysis.DoesNotExist:
            return Response(
                {"error": "Analysis not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def _get_detailed_interpretation(self, painting):
        """
        Provide detailed interpretation of the analysis results.
        """
        confidence = painting.confidence_score
        authenticity = painting.predicted_authenticity

        interpretation = {
            "confidence_level": self._get_confidence_level(confidence),
            "authenticity_explanation": self._explain_authenticity(
                authenticity, confidence
            ),
            "technical_notes": self._get_technical_notes(confidence),
        }

        return interpretation

    def _get_confidence_level(self, confidence):
        """Map confidence score to human-readable level."""
        if confidence >= 0.9:
            return "Very High"
        elif confidence >= 0.8:
            return "High"
        elif confidence >= 0.7:
            return "Moderate"
        elif confidence >= 0.6:
            return "Low"
        else:
            return "Very Low"

    def _explain_authenticity(self, authenticity, confidence):
        """Provide explanation for the authenticity classification."""
        if authenticity == "real":
            if confidence > 0.8:
                return "Strong evidence of human artistic creation with traditional techniques."
            else:
                return "Likely human-created but with some digital processing or modern techniques."
        elif authenticity == "fake":
            if confidence > 0.8:
                return "Clear AI-generated patterns detected in the artwork."
            else:
                return "Possible AI generation or heavy digital manipulation detected."
        else:
            return "Ambiguous result - could be borderline case or mixed media."

    def _get_technical_notes(self, confidence):
        """Provide technical notes about the analysis."""
        notes = []

        if confidence > 0.9:
            notes.append("Model prediction is highly reliable")
        elif confidence < 0.6:
            notes.append("Low confidence - manual review recommended")

        notes.append("Analysis based on deep learning AI detection model")
        notes.append(
            "Factors considered: brushwork patterns, digital artifacts, frequency analysis"
        )

        return notes

    @action(detail=False, methods=["get"])
    def model_info(self, request):
        """
        Get information about the loaded model.
        """
        if not self.ml_model:
            return Response(
                {"error": "Model not loaded"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        info = {
            "model_type": "AI Detection Model",
            "input_size": "256x256 RGB",
            "output_classes": ["human_made", "ai_generated"],
            "framework": "TensorFlow/Keras",
            "features": [
                "Custom bias layer for class imbalance",
                "Brushwork analysis",
                "Frequency domain analysis",
                "Color uniformity analysis",
            ],
            "status": "loaded",
        }

        return Response(info)


#
# class PaintingPricePredictionView(APIView):
#     """
#     API endpoint for predicting painting prices using CatBoost model
#     """
#
#     def __init__(self, **kwargs):
#         super().__init__(**kwargs)
#         self.model = None
#         self.model_path = os.path.join(
#             os.path.dirname(__file__),
#             "catboost_model.joblib"
#         )
#
#     def load_model(self):
#         """Load the CatBoost model"""
#         if self.model is None:
#             try:
#                 self.model = joblib.load(self.model_path)
#             except FileNotFoundError:
#                 raise Exception(f"Model file not found at {self.model_path}")
#             except Exception as e:
#                 raise Exception(f"Error loading model: {str(e)}")
#         return self.model
#
#     def post(self, request):
#         """
#         POST endpoint for price prediction
#         """
#         # Validate input data
#         serializer = PaintingPredictionSerializer(data=request.data)
#
#         if not serializer.is_valid():
#             return Response(
#                 {
#                     "error": "Invalid input data",
#                     "details": serializer.errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         try:
#             # Load model
#             model = self.load_model()
#
#             # Prepare data for prediction
#             validated_data = serializer.validated_data
#
#             # Create DataFrame with correct column names (matching training data)
#             input_df = pd.DataFrame([{
#                 'Name of Painter': validated_data['Name_of_Painter'],
#                 'Subject of Painting': validated_data['Subject_of_Painting'],
#                 'Style': validated_data['Style'],
#                 'Medium': validated_data['Medium'],
#                 'Size': validated_data['Size'],
#                 'Frame': validated_data['Frame'],
#                 'Location': validated_data['Location'],
#                 'Delivery (days)': validated_data['Delivery_days'],
#                 'Shipment': validated_data['Shipment'],
#                 'Color Palette': validated_data['Color_Palette'],
#                 'Copy or Original': validated_data['Copy_or_Original'],
#                 'Print or Real': validated_data['Print_or_Real'],
#                 'Recommended Environment': validated_data['Recommended_Environment'],
#                 'Mood/Atmosphere': validated_data['Mood_Atmosphere'],
#                 'Theme/Lighting Requirements': validated_data['Theme_Lighting_Requirements'],
#                 'Reproduction Type': validated_data['Reproduction_Type'],
#                 'Target Audience': validated_data['Target_Audience']
#             }])
#
#             # Make prediction
#             prediction = model.predict(input_df)
#             predicted_price = float(prediction[0])
#
#             # Prepare response
#             response_data = {
#                 "predicted_price": round(predicted_price, 2),
#                 "input_data": validated_data,
#                 "model_version": "CatBoost v1.0",
#                 "timestamp": datetime.now().isoformat()
#             }
#
#             return Response(response_data, status=status.HTTP_200_OK)
#
#         except Exception as e:
#             return Response(
#                 {
#                     "error": "Prediction failed",
#                     "details": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
#
#     def get(self, request):
#         """
#         GET endpoint for health check
#         """
#         try:
#             model = self.load_model()
#             return Response(
#                 {
#                     "status": "healthy",
#                     "model_loaded": True,
#                     "model_path": self.model_path,
#                     "endpoint": "/api/predict-price/",
#                     "methods": ["POST", "GET"]
#                 },
#                 status=status.HTTP_200_OK
#             )
#         except Exception as e:
#             return Response(
#                 {
#                     "status": "unhealthy",
#                     "model_loaded": False,
#                     "error": str(e)
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
#

# views.py
import os
from datetime import datetime
import joblib
import pandas as pd
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaintingPredictionSerializer


class PaintingPricePredictionView(APIView):
    """
    API endpoint for predicting painting prices using CatBoost model.
    Accepts either:
      1) {"art_id": <id>}            -> loads Art and maps to payload
      2) Raw payload fields (existing) -> uses serializer and predicts
    """

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.model = None
        self.model_path = os.path.join(
            os.path.dirname(__file__), "catboost_model.joblib"
        )

    # -----------------------
    # Helpers (mapping logic)
    # -----------------------
    def _resolve_size(self, art: Art) -> str:
        """Return size string 'W x H [units]' or fallback to dimensions."""
        if art.width and art.height:
            units = f" {art.units}" if art.units else ""
            return f"{art.width}'x {art.height}'"
        if art.dimensions:
            return art.dimensions
        return ""

    def _payload_from_art(self, art: Art) -> dict:
        """Map your Art model to the prediction payload schema."""
        artist_name = (
            getattr(art.artist, "get_full_name", lambda: None)()
            or getattr(art.artist, "username", "")
            or str(art.artist)
        )

        # Optional normalization (tweak to match your training labels exactly)
        lighting = {
            "Bright Light": "Bright",
            "Natural Light": "Natural Light",
            "Soft Light": "Soft Light",
        }.get(
            art.lighting_requirements or "",
            art.lighting_requirements or "Natural Light",
        )

        reproduction = {
            "No Value": "None",  # if training used "None"
            "Giclee": "Giclée Print",  # adjust if needed
        }.get(art.reproduction_type or "", art.reproduction_type or "None")

        shipment = {
            "Standard": "Standard",
            "Express": "Express",
            "Free Shipping": "Free Shipping",
        }.get(art.shipment_type or "", art.shipment_type or "Standard")

        return {
            "Name_of_Painter": artist_name,
            "Subject_of_Painting": art.category or art.title or "",
            "Style": art.type or "",
            "Medium": art.medium or "",
            "Size": self._resolve_size(art),
            "Frame": art.frame or "No",
            "Location": art.location or "",
            "Delivery_days": art.delivery_days or 0,
            "Shipment": shipment,
            "Color_Palette": art.color_palette or "Neutral",
            "Copy_or_Original": art.copy_or_original or "Original",
            "Print_or_Real": art.print_or_real or "Real",
            "Recommended_Environment": art.recommended_environment or "Living Room",
            "Mood_Atmosphere": art.mood_atmosphere or "Neutral",
            "Theme_Lighting_Requirements": lighting,
            "Reproduction_Type": reproduction,
            "Target_Audience": art.target_audience or "Collectors",
        }

    def load_model(self):
        """Load the CatBoost model"""
        if self.model is None:
            try:
                self.model = joblib.load(self.model_path)
            except FileNotFoundError:
                raise Exception(f"Model file not found at {self.model_path}")
            except Exception as e:
                raise Exception(f"Error loading model: {str(e)}")
        return self.model

    def _df_from_payload(self, payload: dict) -> pd.DataFrame:
        """Build DataFrame with the exact column names used during training."""
        return pd.DataFrame(
            [
                {
                    "Name of Painter": payload["Name_of_Painter"],
                    "Subject of Painting": payload["Subject_of_Painting"],
                    "Style": payload["Style"],
                    "Medium": payload["Medium"],
                    "Size": payload["Size"],
                    "Frame": payload["Frame"],
                    "Location": payload["Location"],
                    "Delivery (days)": payload["Delivery_days"],
                    "Shipment": payload["Shipment"],
                    "Color Palette": payload["Color_Palette"],
                    "Copy or Original": payload["Copy_or_Original"],
                    "Print or Real": payload["Print_or_Real"],
                    "Recommended Environment": payload["Recommended_Environment"],
                    "Mood/Atmosphere": payload["Mood_Atmosphere"],
                    "Theme/Lighting Requirements": payload[
                        "Theme_Lighting_Requirements"
                    ],
                    "Reproduction Type": payload["Reproduction_Type"],
                    "Target Audience": payload["Target_Audience"],
                }
            ]
        )

    def post(self, request):
        """
        POST endpoint for price prediction.

        Accepts:
          - {"art_id": 123}
          - or the raw fields:
            {
              "Name_of_Painter": "...",
              "Subject_of_Painting": "...",
              ...
            }
        """
        try:
            # Branch 1: art_id path
            art_id = request.data.get("art_id") or request.data.get("art")
            if art_id:
                art = get_object_or_404(Art, pk=art_id)
                payload = self._payload_from_art(art)
                source = "art"
            else:
                # Branch 2: raw payload path (existing behavior)
                serializer = PaintingPredictionSerializer(data=request.data)
                if not serializer.is_valid():
                    return Response(
                        {"error": "Invalid input data", "details": serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                payload = serializer.validated_data
                source = "raw"

            # Load model
            model = self.load_model()

            # Predict
            input_df = self._df_from_payload(payload)
            prediction = model.predict(input_df)
            predicted_price = float(prediction[0])

            # Response
            return Response(
                {
                    "predicted_price": round(predicted_price, 2),
                    "input_data": payload,
                    "source": source,  # "art" or "raw"
                    "model_version": "CatBoost v1.0",
                    "timestamp": datetime.now().isoformat(),
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": "Prediction failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get(self, request):
        """Simple health check"""
        try:
            self.load_model()
            return Response(
                {
                    "status": "healthy",
                    "model_loaded": True,
                    "model_path": self.model_path,
                    "endpoint": "/api/analysis/api/price-analysis/",  # keep in sync with urls.py
                    "methods": ["POST", "GET"],
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"status": "unhealthy", "model_loaded": False, "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
