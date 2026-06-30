from django.db import models
import uuid


class PaintingAnalysis(models.Model):
    AUTHENTICITY_CHOICES = [
        ("real", "Real"),
        ("fake", "Fake"),
        ("replica", "Replica"),
        ("uncertain", "Uncertain"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to="paintings/")
    predicted_authenticity = models.CharField(
        max_length=20, choices=AUTHENTICITY_CHOICES
    )
    confidence_score = models.FloatField()
    analysis_timestamp = models.DateTimeField(auto_now_add=True)

    # Additional metadata
    artist_name = models.CharField(max_length=200, blank=True, null=True)
    artwork_title = models.CharField(max_length=300, blank=True, null=True)
    estimated_period = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ["-analysis_timestamp"]
