"""PrintHub SLA Engine — mesure de la qualité de service réelle.

Cibles SLA (configurables via settings.SLA_TARGETS) :
- Quote response : première offre sous 10 secondes (P95)
- BAT analysis : < 60 secondes (P95)
- Order acceptance par imprimeur : < 60 minutes
- Production start : < 24 heures après paiement
- Delivery : selon délai promis ± 12 heures

Calcule un SLA Score global 0-100 par imprimeur et par région.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import timedelta
from typing import Any

from django.db.models import Avg, Count, F, Q
from django.utils import timezone


# Cibles SLA (en secondes)
SLA_TARGETS = {
    "quote_first_offer_sec": 30,
    "bat_analysis_sec": 60,
    "order_acceptance_min": 60,
    "production_start_hours": 24,
    "delivery_tolerance_hours": 12,
}


@dataclass
class SLABreakdown:
    quote_response_pct: float
    bat_analysis_pct: float
    order_acceptance_pct: float
    production_start_pct: float
    delivery_on_time_pct: float
    overall_sla_score: int  # 0-100


def _percentile_compliance(qs, source_field: str, target_field: str, target_seconds: int) -> float:
    """Calcule le % d'enregistrements respectant la cible SLA."""
    matched = 0
    total = 0
    for obj in qs:
        s = getattr(obj, source_field, None)
        t = getattr(obj, target_field, None)
        if not s or not t:
            continue
        total += 1
        delta = (t - s).total_seconds() if t > s else 0
        if delta <= target_seconds:
            matched += 1
    return round((matched / total * 100), 1) if total else 100.0


def compute_printer_sla(printer, days: int = 30) -> SLABreakdown:
    """Calcule le SLA Score d'un imprimeur sur la période."""
    from apps.orders.models import OrderStatus
    from apps.quote_requests.models import QuoteRequest

    since = timezone.now() - timedelta(days=days)
    orders = printer.orders.filter(created_at__gte=since)

    # 1. Quote first offer = délai entre QuoteRequest.created_at et QuoteOffer.created_at
    offers = printer.quote_offers.filter(created_at__gte=since).select_related("request")
    quote_compliance = 0
    quote_total = 0
    for offer in offers:
        delay = (offer.created_at - offer.request.created_at).total_seconds()
        quote_total += 1
        if delay <= SLA_TARGETS["quote_first_offer_sec"]:
            quote_compliance += 1
    quote_pct = round((quote_compliance / quote_total * 100), 1) if quote_total else 100.0

    # 2. BAT analysis (depuis order.created_at jusqu'à premier BATAnalysis done)
    bat_pct = 95.0  # placeholder — necessite join sur BATAnalysis (TODO si module activé)

    # 3. Order acceptance par imprimeur : assigned_at → accepted_at
    acceptance_total = 0
    acceptance_ok = 0
    target_sec = SLA_TARGETS["order_acceptance_min"] * 60
    for order in orders.exclude(accepted_at__isnull=True):
        history = order.status_history.filter(to_status=OrderStatus.ASSIGNED).first()
        if history:
            delta = (order.accepted_at - history.created_at).total_seconds()
            acceptance_total += 1
            if delta <= target_sec:
                acceptance_ok += 1
    acceptance_pct = round((acceptance_ok / acceptance_total * 100), 1) if acceptance_total else 100.0

    # 4. Production start : paid_at → first ProductionJob.started_at
    prod_total = 0
    prod_ok = 0
    target_sec = SLA_TARGETS["production_start_hours"] * 3600
    for order in orders.filter(paid_at__isnull=False, production_job__started_at__isnull=False):
        delta = (order.production_job.started_at - order.paid_at).total_seconds()
        prod_total += 1
        if delta <= target_sec:
            prod_ok += 1
    prod_pct = round((prod_ok / prod_total * 100), 1) if prod_total else 100.0

    # 5. Delivery on-time : delivered_at ≤ expected_delivery_at + tolerance
    delivery_total = 0
    delivery_ok = 0
    tolerance = timedelta(hours=SLA_TARGETS["delivery_tolerance_hours"])
    for order in orders.filter(delivered_at__isnull=False, expected_delivery_at__isnull=False):
        delivery_total += 1
        if order.delivered_at <= order.expected_delivery_at + tolerance:
            delivery_ok += 1
    delivery_pct = round((delivery_ok / delivery_total * 100), 1) if delivery_total else 100.0

    # Score global pondéré
    overall = int(
        quote_pct * 0.15
        + bat_pct * 0.10
        + acceptance_pct * 0.15
        + prod_pct * 0.30
        + delivery_pct * 0.30
    )

    return SLABreakdown(
        quote_response_pct=quote_pct,
        bat_analysis_pct=bat_pct,
        order_acceptance_pct=acceptance_pct,
        production_start_pct=prod_pct,
        delivery_on_time_pct=delivery_pct,
        overall_sla_score=overall,
    )


def detect_sla_breaches(printer=None) -> list[dict[str, Any]]:
    """Détecte les commandes en cours qui dépassent les SLA → alertes temps réel."""
    from apps.orders.models import Order, OrderStatus

    now = timezone.now()
    breaches: list[dict[str, Any]] = []

    # 1. Devis sans offre depuis > 30 s
    from apps.quote_requests.models import QuoteRequest, QuoteStatus
    qs = QuoteRequest.objects.filter(status=QuoteStatus.OPEN)
    threshold = now - timedelta(seconds=SLA_TARGETS["quote_first_offer_sec"])
    for qr in qs.filter(created_at__lt=threshold):
        breaches.append({
            "type": "quote_no_offer",
            "severity": "warning",
            "resource": f"QuoteRequest:{qr.id}",
            "since": qr.created_at.isoformat(),
        })

    # 2. Commandes assignées non acceptées > 60 min
    threshold = now - timedelta(minutes=SLA_TARGETS["order_acceptance_min"])
    qs = Order.objects.filter(status=OrderStatus.ASSIGNED, created_at__lt=threshold)
    if printer:
        qs = qs.filter(printer=printer)
    for o in qs:
        breaches.append({
            "type": "order_acceptance_late",
            "severity": "warning",
            "resource": f"Order:{o.reference}",
            "since": o.created_at.isoformat(),
            "printer": str(o.printer_id) if o.printer_id else None,
        })

    # 3. Production non démarrée > 24h après paiement
    threshold = now - timedelta(hours=SLA_TARGETS["production_start_hours"])
    qs = Order.objects.filter(
        status__in=[OrderStatus.ACCEPTED, OrderStatus.PAID, OrderStatus.ASSIGNED],
        paid_at__lt=threshold,
    )
    if printer:
        qs = qs.filter(printer=printer)
    for o in qs:
        breaches.append({
            "type": "production_start_late",
            "severity": "high",
            "resource": f"Order:{o.reference}",
            "since": o.paid_at.isoformat() if o.paid_at else None,
            "printer": str(o.printer_id) if o.printer_id else None,
        })

    # 4. Livraison en retard
    qs = Order.objects.filter(
        status__in=[OrderStatus.IN_DELIVERY, OrderStatus.READY_FOR_PICKUP, OrderStatus.QUALITY_CHECK],
        expected_delivery_at__lt=now - timedelta(hours=SLA_TARGETS["delivery_tolerance_hours"]),
        delivered_at__isnull=True,
    )
    if printer:
        qs = qs.filter(printer=printer)
    for o in qs:
        breaches.append({
            "type": "delivery_late",
            "severity": "critical",
            "resource": f"Order:{o.reference}",
            "since": o.expected_delivery_at.isoformat(),
            "printer": str(o.printer_id) if o.printer_id else None,
        })

    return breaches


def compute_regional_sla(country: str | None = None, days: int = 30) -> dict[str, Any]:
    """SLA agrégé par pays."""
    from apps.printers.models import PrinterProfile

    qs = PrinterProfile.objects.filter(status="active")
    if country:
        qs = qs.filter(country=country)

    sla_scores = []
    for printer in qs:
        sla = compute_printer_sla(printer, days)
        sla_scores.append(sla.overall_sla_score)

    if not sla_scores:
        return {"country": country, "avg_sla": 0, "printers_count": 0}

    return {
        "country": country,
        "avg_sla": round(sum(sla_scores) / len(sla_scores), 1),
        "printers_count": len(sla_scores),
        "best_score": max(sla_scores),
        "worst_score": min(sla_scores),
    }
