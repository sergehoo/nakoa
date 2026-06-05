from django.apps import AppConfig


class PrintersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.printers"
    verbose_name = "Imprimeurs"

    def ready(self):
        # Branche les signaux (auto-création PrinterProfile à l'inscription)
        from . import signals  # noqa: F401
