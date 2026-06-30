from django.apps import AppConfig


class QualificationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "fann.qualification"
    verbose_name = "TryFann Qualification"

    def ready(self):
        from . import signals  # noqa: F401  (register post_save hooks)
