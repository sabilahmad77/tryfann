import tensorflow as tf
import numpy as np
from keras.models import load_model
from PIL import Image
import cv2
from typing import Tuple, Dict
import logging

logger = logging.getLogger(__name__)


class ModelWrapper:
    """
    Model wrapper class for resolving model loading errors.
    The custom model wrapper is needed to load the model due to the inclusion of a custom bias layer,
    initialized so as to eliminate the effects of a class imbalance in the data.
    The model was developed using tensorflow 2.15.1 however it is compatible with later versions
    (this code runs on 2.16.1) using the wrapper. Wrapper includes a function to process images
    before predictions, necessary because the model will only take RGB images of dimension 256x256.
    """

    def __init__(self, model_path):
        try:
            self.model = load_model(
                model_path, compile=False, custom_objects={"Dense": self.tf_wrapper}
            )
            self.model.summary()
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    @staticmethod
    def tf_wrapper(*args, **kwargs):
        config = kwargs.get("config", {})
        # custom bias layer: constant value = log(pos/neg) where
        # pos is number of ai images, neg is number of human-made
        if kwargs.get("name", None) == "dense_1":
            return tf.keras.layers.Dense(
                units=config.get("units", 1),
                activation=config.get("activation", "sigmoid"),
                use_bias=config.get("use_bias", True),
                kernel_initializer=tf.keras.initializers.get(
                    config.get("kernel_initializer", "GlorotUniform")
                ),
                bias_initializer=tf.keras.initializers.Constant(
                    value=0.8498341056885719
                ),
                kernel_regularizer=tf.keras.regularizers.get(
                    config.get("kernel_regularizer")
                ),
                bias_regularizer=tf.keras.regularizers.get(
                    config.get("bias_regularizer")
                ),
                activity_regularizer=tf.keras.regularizers.get(
                    config.get("activity_regularizer")
                ),
                kernel_constraint=tf.keras.constraints.get(
                    config.get("kernel_constraint")
                ),
                bias_constraint=tf.keras.constraints.get(config.get("bias_constraint")),
            )
        # regular dense layer
        else:
            return tf.keras.layers.Dense(
                units=config.get("units", 128),
                activation=config.get("activation", "relu"),
                use_bias=config.get("use_bias", True),
                kernel_initializer=tf.keras.initializers.get(
                    config.get("kernel_initializer", "GlorotUniform")
                ),
                bias_initializer=tf.keras.initializers.get(
                    config.get("bias_initializer", "Zeros")
                ),
                kernel_regularizer=tf.keras.regularizers.get(
                    config.get("kernel_regularizer")
                ),
                bias_regularizer=tf.keras.regularizers.get(
                    config.get("bias_regularizer")
                ),
                activity_regularizer=tf.keras.regularizers.get(
                    config.get("activity_regularizer")
                ),
                kernel_constraint=tf.keras.constraints.get(
                    config.get("kernel_constraint")
                ),
                bias_constraint=tf.keras.constraints.get(config.get("bias_constraint")),
            )

    @staticmethod
    def process_image(img):
        """Image preprocessing for model prediction"""
        img = img.convert("RGB")
        img = img.resize((256, 256))
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array

    @property
    def get_model(self):
        return self.model


class ArtAuthenticationModel:
    """
    Enhanced Art Authentication Model using your pre-trained model
    """

    def __init__(self, model_path=None):
        """
        Initialize the art authentication model with your custom wrapper.
        """
        if model_path is None:
            raise ValueError("model_path is required for the pre-trained model")

        try:
            self.model_wrapper = ModelWrapper(model_path)
            self.model = self.model_wrapper.get_model
            self.input_size = (256, 256)  # Updated to match your model's requirements

            # Assuming binary classification: AI-generated vs Human-made
            # Update these based on your model's actual classes
            self.class_names = ["human_made", "ai_generated"]

            logger.info("Art authentication model loaded successfully")

        except Exception as e:
            logger.error(f"Failed to initialize model: {e}")
            raise

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for model prediction using the wrapper's method.
        """
        try:
            with Image.open(image_path) as img:
                processed_img = self.model_wrapper.process_image(img)
            return processed_img
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise

    def analyze_brushwork(self, image_path: str) -> Dict[str, float]:
        """
        Analyze brushwork patterns - key indicator of authenticity.
        Enhanced analysis for AI vs Human detection.
        """
        try:
            image = cv2.imread(image_path)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Detect edges (brushstrokes and digital artifacts)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size

            # Analyze texture variance
            texture_variance = np.var(gray)

            # Additional analysis for AI detection
            # Look for typical AI artifacts

            # Frequency domain analysis
            f_transform = np.fft.fft2(gray)
            f_shift = np.fft.fftshift(f_transform)
            magnitude_spectrum = np.log(np.abs(f_shift) + 1)
            frequency_variance = np.var(magnitude_spectrum)

            # Color histogram analysis
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            hist_r = cv2.calcHist([image_rgb], [0], None, [256], [0, 256])
            hist_g = cv2.calcHist([image_rgb], [1], None, [256], [0, 256])
            hist_b = cv2.calcHist([image_rgb], [2], None, [256], [0, 256])

            color_uniformity = (np.var(hist_r) + np.var(hist_g) + np.var(hist_b)) / 3

            return {
                "edge_density": float(edge_density),
                "texture_variance": float(texture_variance),
                "frequency_variance": float(frequency_variance),
                "color_uniformity": float(color_uniformity),
            }
        except Exception as e:
            logger.error(f"Error in brushwork analysis: {str(e)}")
            return {
                "edge_density": 0.0,
                "texture_variance": 0.0,
                "frequency_variance": 0.0,
                "color_uniformity": 0.0,
            }

    def predict_authenticity(self, image_path: str) -> Dict[str, any]:
        """
        Predict if a painting is human-made or AI-generated using your pre-trained model.
        """
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_path)

            # Get model prediction
            predictions = self.model.predict(processed_image, verbose=0)

            # Handle different prediction formats
            if predictions.shape[1] == 1:  # Binary classification with sigmoid
                ai_prob = float(predictions[0][0])
                human_prob = 1.0 - ai_prob
                predicted_class_idx = 1 if ai_prob > 0.5 else 0
            else:  # Multi-class with softmax
                predicted_class_idx = np.argmax(predictions[0])
                ai_prob = (
                    float(predictions[0][1])
                    if len(predictions[0]) > 1
                    else float(predictions[0][0])
                )
                human_prob = (
                    float(predictions[0][0])
                    if len(predictions[0]) > 1
                    else 1.0 - ai_prob
                )

            confidence = max(ai_prob, human_prob)
            predicted_class = self.class_names[predicted_class_idx]

            # Analyze additional features
            brushwork_analysis = self.analyze_brushwork(image_path)

            # Map to your API's expected format
            # Convert AI detection to authenticity classification
            if predicted_class == "human_made":
                authenticity = "real"
            else:
                authenticity = "fake"  # AI-generated considered as fake

            # Adjust confidence based on additional analysis
            if confidence < 0.6:
                authenticity = "uncertain"

            return {
                "authenticity": authenticity,
                "confidence": confidence,
                "class_probabilities": {
                    "human_made": human_prob,
                    "ai_generated": ai_prob,
                    "real": human_prob,  # For backward compatibility
                    "fake": ai_prob,  # For backward compatibility
                },
                "brushwork_analysis": brushwork_analysis,
                "raw_prediction": (
                    float(predictions[0][0])
                    if predictions.shape[1] == 1
                    else predictions[0].tolist()
                ),
            }

        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            raise
