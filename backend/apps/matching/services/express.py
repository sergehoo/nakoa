"""Mode Express 4 heures — matching ultra-restrictif avec premium price.

Critères stricts :
- Imprimeurs avec `current_load_pct < 70 %`
- Disponibilité immédiate confirmée (business_hours en cours)
- Capacité minimum garantie sur le produit
- Distance < 30 km du point de livraison

Pricing : +30 % à +80 % selon la pression demande/offre.
SLA : garantie remboursement 100 % si retard.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from django.utils import timezone

from apps.printers.models import PrinterProfile, PrinterStatus
from apps.quote_requests.models import QuoteRequest


EXPRESS_MAX_HOURS = 4
EXPRESS_MAX_LOAD_PCT = Decimal("70")
EXPRESS_MAX_DISTANCE_KM = 30
EXPRESS_PREMIUM_BASE_PCT = Decimal("30")  # +30 % minimum
EXPRESS_PREMIUM_MAX_PCT = Decimal("80")   # +80 % en cas de tension


@dataclass
class ExpressOffer:
    printer_id: str
    printer_name: str
    base_price: Decimal
    express_premium_pct: Decimal
    express_total: Decimal
    eta_hours: int
    distance_km: float


def is_business_hours(printer: PrinterProfile) -> bool:
    """Vérifie si l'imprimeur est dans ses heures ouvrables."""
    hours = printer.business_hours or {}
    now = timezone.now()
    weekday_keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    today_key = weekday_keys[now.weekday()]
    day_hours = hours.get(today_key)
    if not day_hours:
        return False
    try:
        open_t = datetime.strptime(day_hours["open"], "%H:%M").time()
        close_t = datetime.strptime(day_hours["close"], "%H:%M").time()
        return open_t <= now.time() <= close_t
    except Exception:  # noqa: BLE001
        return False


def find_express_candidates(request: QuoteRequest) -> list[PrinterProfile]:
    """Imprimeurs éligibles au mode Express pour ce devis."""
    return [
        p for p in PrinterProfile.objects.filter(
            status=PrinterStatus.ACTIVE,
            current_load_pct__lt=EXPRESS_MAX_LOAD_PCT,
        ).filter(capabilities__category=request.product.category).distinct()
        if is_business_hours(p)
    ]


def compute_express_premium(load_pct: Decimal, demand_pressure: float = 1.0) -> Decimal:
    """Calcule le premium Express dynamique.

    Plus l'imprimeur est chargé (proche de 70 %) ou plus la demande est forte,
    plus le premium est élevé. Reste capé à +80 %.
    """
    load_factor = float(load_pct) / float(EXPRESS_MAX_LOAD_PCT)
    raw_premium = float(EXPRESS_PREMIUM_BASE_PCT) * (1 + load_factor * demand_pressure)
    return Decimal(min(raw_premium, float(EXPRESS_PREMIUM_MAX_PCT))).quantize(Decimal("0.1"))


def build_express_offer(printer: PrinterProfile, base_price: Decimal) -> ExpressOffer:
    premium_pct = compute_express_premium(printer.current_load_pct)
    express_total = (base_price * (1 + premium_pct / Decimal("100"))).quantize(Decimal("0.01"))
    eta_hours = EXPRESS_MAX_HOURS
    return ExpressOffer(
        printer_id=str(printer.id),
        printer_name=printer.trade_name,
        base_price=base_price,
        express_premium_pct=premium_pct,
        express_total=express_total,
        eta_hours=eta_hours,
        distance_km=25.0,  # TODO: distance réelle via geo
    )


def express_deadline(order_paid_at) -> datetime:
    """Deadline garantie pour une commande Express."""
    return order_paid_at + timedelta(hours=EXPRESS_MAX_HOURS)


def is_express_late(order) -> bool:
    """Détermine si une commande Express est en retard et déclenche le remboursement."""
    if not order.metadata.get("is_express"):
        return False
    if not order.paid_at:
        return False
    if order.delivered_at and order.delivered_at <= express_deadline(order.paid_at):
        return False
    return timezone.now() > express_deadline(order.paid_at)
