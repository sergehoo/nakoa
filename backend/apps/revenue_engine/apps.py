from django.apps import AppConfig


class RevenueEngineConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.revenue_engine"
    verbose_name = "Revenue Engine"

    def ready(self) -> None:
        # Connecte le signal qui calcule la commission à la complétion d'une commande.
        from . import signals  # noqa: F401
