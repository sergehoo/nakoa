"""Marketplace Intelligence Engine — classement dynamique + badges.

Combine 4 signaux pour produire le ranking :
- PrintHub Score (qualité)
- SLA Score (performance)
- Trust Score (fiabilité)
- Volume 30j (popularité)

Génère automatiquement les badges Premium / Verified / Express / Trusted / Top Seller / AI Recommended.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone


# Pondération du score marketplace
RANK_WEIGHTS = {
    "printhub_score": 0.40,
    "sla_score": 0.25,
    "trust_score": 0.15,
    "volume_score": 0.20,
}


@dataclass
class MarketplaceRank:
    printer_id: str
    trade_name: str
    city: str
    country: str
    rank_score: int          # 0-100
    printhub_score: int      # 0-1000
    sla_score: int           # 0-100
    trust_score: int         # 0-100
    volume_score: int        # 0-100 (normalisé)
    badges: list[str]


def compute_volume_score(printer, days: int = 30) -> int:
    """Score volume = nb commandes payées sur 30j, normalisé."""
    from apps.orders.models import OrderStatus
    since = timezone.now() - timedelta(days=days)
    paid = printer.orders.filter(
        paid_at__gte=since,
        status__in=[OrderStatus.PAID, OrderStatus.IN_PRODUCTION,
                    OrderStatus.DELIVERED, OrderStatus.COMPLETED],
    ).count()
    # Cap à 100 commandes/mois = score max
    return min(100, paid)


def compute_badges(printer, printhub_score, sla_score, trust_score, volume_score) -> list[str]:
    """Détermine quels badges l'imprimeur mérite."""
    badges: list[str] = []

    # Verified — KYC complet
    if printer.kyc_status == "approved":
        badges.append("verified")

    # Premium — qualité ET SLA exemplaires
    avg_rating = printer.reviews.aggregate(a=Avg("overall_rating"))["a"] or 0
    if sla_score >= 95 and avg_rating >= 4.7 and printer.reviews.count() >= 10:
        badges.append("premium")

    # Express — disponibilité immédiate fréquente
    if float(printer.current_load_pct) < 70 and printer.response_time_minutes <= 30:
        badges.append("express")

    # Trusted — trust score haut + faible litiges
    if trust_score >= 80:
        # Vérif taux litiges
        total = printer.orders.count()
        disputed = printer.orders.filter(status="disputed").count() if total else 0
        if total == 0 or disputed / total < 0.05:
            badges.append("trusted")

    # Top Seller — volume dans top 10 %
    if volume_score >= 80:
        badges.append("top_seller")

    # AI Recommended — score composite >= 700/1000
    if printhub_score >= 700:
        badges.append("ai_recommended")

    return badges


def compute_marketplace_rank(printer) -> MarketplaceRank:
    """Calcule la position marketplace de l'imprimeur."""
    from apps.audit.services.fraud_engine import printer_trust_score
    from apps.analytics.services.sla import compute_printer_sla
    from .scoring import compute_printhub_score

    printhub = compute_printhub_score(printer)
    sla = compute_printer_sla(printer, days=30)
    trust = printer_trust_score(printer)
    volume = compute_volume_score(printer)

    # Score marketplace pondéré
    rank_score = int(
        (printhub["score"] / 10) * RANK_WEIGHTS["printhub_score"]
        + sla.overall_sla_score * RANK_WEIGHTS["sla_score"]
        + trust.score * RANK_WEIGHTS["trust_score"]
        + volume * RANK_WEIGHTS["volume_score"]
    )

    badges = compute_badges(
        printer,
        printhub_score=printhub["score"],
        sla_score=sla.overall_sla_score,
        trust_score=trust.score,
        volume_score=volume,
    )

    return MarketplaceRank(
        printer_id=str(printer.id),
        trade_name=printer.trade_name,
        city=printer.city,
        country=printer.country,
        rank_score=min(100, max(0, rank_score)),
        printhub_score=printhub["score"],
        sla_score=sla.overall_sla_score,
        trust_score=trust.score,
        volume_score=volume,
        badges=badges,
    )


def top_printers(
    country: str | None = None,
    category_slug: str | None = None,
    limit: int = 20,
) -> list[MarketplaceRank]:
    """Top imprimeurs par rank_score."""
    from apps.printers.models import PrinterProfile, PrinterStatus

    qs = PrinterProfile.objects.filter(status=PrinterStatus.ACTIVE)
    if country:
        qs = qs.filter(country=country)
    if category_slug:
        qs = qs.filter(capabilities__category__slug=category_slug).distinct()

    ranks = [compute_marketplace_rank(p) for p in qs[:200]]
    ranks.sort(key=lambda r: -r.rank_score)
    return ranks[:limit]


def filter_by_badge(badge: str, country: str | None = None, limit: int = 20) -> list[MarketplaceRank]:
    """Filtre imprimeurs par badge ('premium', 'express', etc.)."""
    candidates = top_printers(country=country, limit=200)
    matching = [r for r in candidates if badge in r.badges]
    return matching[:limit]
