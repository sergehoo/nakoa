"""Statistiques publiques affichées sur la landing page Nakoa.

Endpoint sans authentification, mis en cache courte durée pour soulager la DB.
"""

from __future__ import annotations

import logging

from django.core.cache import cache
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)

_CACHE_KEY = "public:landing:stats:v1"
_CACHE_TTL = 60  # secondes


def _compute_landing_stats() -> dict[str, int]:
    """Calcule les compteurs affichés sur la landing.

    Tous les imports sont locaux pour rester résilient si une app n'est pas
    encore migrée — on retombe alors sur 0 plutôt que de casser la landing.
    """
    result = {
        "active_printers": 0,
        "products": 0,
        "orders_completed": 0,
        "cities_covered": 0,
    }

    try:
        from apps.printers.models import PrinterProfile

        # On considère « actif » un imprimeur dont le compte n'est pas suspendu
        # et qui a publié au moins un produit (PrinterProduct).
        result["active_printers"] = PrinterProfile.objects.filter(
            Q(is_suspended=False) if hasattr(PrinterProfile, "is_suspended") else Q()
        ).count()
    except Exception:  # noqa: BLE001
        logger.debug("Public stats: PrinterProfile indisponible", exc_info=True)

    try:
        from apps.catalog.models import Product

        result["products"] = Product.objects.filter(
            is_active=True if hasattr(Product, "is_active") else True
        ).count() if hasattr(Product, "is_active") else Product.objects.count()
    except Exception:  # noqa: BLE001
        logger.debug("Public stats: Product indisponible", exc_info=True)

    try:
        from apps.orders.models import Order

        # On compte les commandes finalisées (delivered ou completed).
        statuses = []
        for s in ("delivered", "completed", "DELIVERED", "COMPLETED"):
            if Order.objects.filter(status=s).exists():
                statuses.append(s)
        if statuses:
            result["orders_completed"] = Order.objects.filter(status__in=statuses).count()
        else:
            result["orders_completed"] = Order.objects.count()
    except Exception:  # noqa: BLE001
        logger.debug("Public stats: Order indisponible", exc_info=True)

    try:
        from apps.printers.models import PrinterProfile

        if hasattr(PrinterProfile, "city"):
            result["cities_covered"] = (
                PrinterProfile.objects.exclude(city__isnull=True)
                .exclude(city__exact="")
                .values("city")
                .annotate(n=Count("id"))
                .count()
            )
    except Exception:  # noqa: BLE001
        logger.debug("Public stats: cities indisponible", exc_info=True)

    return result


@api_view(["GET"])
@permission_classes([AllowAny])
def landing_stats(request):
    """Compteurs publics affichés sur la landing page.

    Réponse :
    ```
    {
      "active_printers": int,
      "products": int,
      "orders_completed": int,
      "cities_covered": int
    }
    ```
    """
    cached = cache.get(_CACHE_KEY)
    if cached is not None:
        return Response(cached)

    stats = _compute_landing_stats()
    try:
        cache.set(_CACHE_KEY, stats, _CACHE_TTL)
    except Exception:  # noqa: BLE001
        pass
    return Response(stats)
