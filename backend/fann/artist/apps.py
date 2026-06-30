from django.apps import AppConfig


class ArtistConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "fann.artist"

    def ready(self):
        import fann.artist.signals
