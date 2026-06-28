"""Services applicatifs des Premium Services.

- PremiumServicePricer : calcule les totaux sur une liste de services choisis.
- record_revenue : à appeler une fois la commande payée pour enregistrer
  les revenus dans le Revenue Engine.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from decimal import Decimal

from django.utils import timezone

from .models import OrderService, PremiumService

logger = logging.getLogger(__name__)


@dataclass
class ServiceLine:
    """Une ligne demandée par le client : service + quantité."""

    service: PremiumService
    quantity: int = 1
    unit_price: Decimal = Decimal("0")
    total: Decimal = Decimal("0")


@dataclass
class PricingResult:
    """Résultat agrégé du calcul."""

    lines: list[ServiceLine] = field(default_factory=list)
    subtotal: Decimal = Decimal("0")
    currency: str = "XOF"

    def to_dict(self) -> dict:
        return {
            "subtotal": str(self.subtotal),
            "currency": self.currency,
            "lines": [
                {
                    "service_code": l.service.code,
                    "service_name": l.service.name,
                    "quantity": l.quantity,
                    "unit_price": str(l.unit_price),
                    "total": str(l.total),
                }
                for l in self.lines
            ],
        }


class PremiumServicePricer:
    """Calcule les coûts des services optionnels et obligatoires sur une commande."""

    def price(
        self, *, service_codes: list[tuple[str, int]], order_total: Decimal,
        currency: str = "XOF",
    ) -> PricingResult:
        """Calcule le total pour une sélection de services.

        Args:
            service_codes: liste de tuples (code, quantity).
            order_total: total HT de la commande, utile pour les services
                         tarifés en pourcentage.
        """
        result = PricingResult(currency=currency)
        if not service_codes:
            return result

        codes = [code for code, _ in service_codes]
        services = {
            s.code: s
            for s in PremiumService.objects.filter(
                code__in=codes, is_active=True, is_visible=True,
            )
        }

        for code, qty in service_codes:
            service = services.get(code)
            if not service:
                continue
            unit, total = self._compute_line(service, qty, order_total)
            result.lines.append(ServiceLine(
                service=service,
                quantity=qty,
                unit_price=unit,
                total=total,
            ))
            result.subtotal += total

        result.subtotal = result.subtotal.quantize(Decimal("0.01"))
        return result

    @staticmethod
    def _compute_line(
        service: PremiumService, quantity: int, order_total: Decimal,
    ) -> tuple[Decimal, Decimal]:
        qty = max(1, int(quantity or 1))
        if service.pricing_type == PremiumService.PricingType.FIXED:
            unit = service.base_price
            total = unit
        elif service.pricing_type == PremiumService.PricingType.PER_UNIT:
            unit = service.base_price
            total = (unit * qty).quantize(Decimal("0.01"))
        elif service.pricing_type == PremiumService.PricingType.PERCENTAGE:
            unit = (order_total * service.percentage).quantize(Decimal("0.01"))
            total = unit
        else:  # VARIABLE → 0, sera renseigné manuellement
            unit = Decimal("0")
            total = Decimal("0")
        return unit, total

    def get_required_for_categories(self, category_slugs: list[str]) -> list[PremiumService]:
        """Renvoie les services marqués comme requis pour ces catégories produits."""
        qs = PremiumService.objects.filter(is_active=True, is_required=True)
        out: list[PremiumService] = []
        for service in qs:
            cats = service.applies_to_categories or []
            if not cats or any(c in cats for c in category_slugs):
                out.append(service)
        return out


# ============================================================
# Persistance OrderService + Revenue Engine
# ============================================================
def attach_services_to_order(
    *, order_id, lines: list[ServiceLine], currency: str = "XOF",
) -> list[OrderService]:
    """Persiste les services choisis sur une commande."""
    created: list[OrderService] = []
    for line in lines:
        os = OrderService.objects.create(
            order_id=order_id,
            service=line.service,
            quantity=line.quantity,
            unit_price=line.unit_price,
            total=line.total,
            currency=currency,
        )
        created.append(os)
    return created


def record_revenue(order_services: list[OrderService]) -> int:
    """Écrit une RevenueEntry par service livré (source=premium_service)."""
    try:
        from apps.revenue_engine.models import RevenueEntry, RevenueSource
    except ImportError:
        return 0

    source = (
        RevenueSource.objects.filter(
            kind=RevenueSource.Kind.PREMIUM_SERVICE, is_enabled=True
        )
        .order_by("sort_order")
        .first()
    )
    if not source:
        return 0

    count = 0
    for os in order_services:
        if os.total <= 0:
            continue
        try:
            RevenueEntry.objects.create(
                source=source,
                amount=os.total,
                currency=os.currency,
                occurred_at=timezone.now(),
                order_id=os.order_id,
                category=os.service.code,
                metadata={
                    "service_code": os.service.code,
                    "service_name": os.service.name,
                    "quantity": os.quantity,
                    "order_service_id": str(os.id),
                },
            )
            count += 1
        except Exception:  # noqa: BLE001
            logger.exception("Échec RevenueEntry pour OrderService %s", os.id)
    return count
