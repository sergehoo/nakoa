"""PrintHub Score — calcul composite 0-1000 + badges Bronze/Argent/Or/Platinum."""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

from django.db.models import Avg
from django.utils import timezone


SCORE_WEIGHTS = {
    "quality": 0.18, "on_time": 0.15, "response_time": 0.08,
    "completion_rate": 0.12, "reviews_volume": 0.05, "seniority": 0.04,
    "kyb_strength": 0.06, "capacity_usage": 0.05, "dispute_rate": 0.08,
    "refund_rate": 0.07, "repeat_customer": 0.05, "catalog_depth": 0.03,
    "geo_coverage": 0.02, "care_eligible": 0.01, "express_capable": 0.01,
}


@dataclass
class ScoreBreakdown:
    quality: float
    on_time: float
    response_time: float
    completion_rate: float
    reviews_volume: float
    seniority: float
    kyb_strength: float
    capacity_usage: float
    dispute_rate: float
    refund_rate: float
    repeat_customer: float
    catalog_depth: float
    geo_coverage: float
    care_eligible: float
    express_capable: float


def _normalize(value: float, max_value: float, invert: bool = False) -> float:
    if max_value <= 0:
        return 0.0
    ratio = min(value / max_value, 1.0)
    return round((1 - ratio if invert else ratio) * 100, 1)


def compute_printhub_score(printer) -> dict[str, Any]:
    reviews = printer.reviews.filter(status="published")
    avg_rating = float(reviews.aggregate(avg=Avg("overall_rating"))["avg"] or 0)
    quality = (avg_rating / 5) * 100 if avg_rating else float(printer.quality_score)
    reviews_count = reviews.count()

    orders = printer.orders.all()
    total_orders = orders.count()
    completed = orders.filter(status__in=["delivered", "completed"]).count()
    disputed = orders.filter(status="disputed").count()
    refunded = orders.filter(status="refunded").count()
    completion_rate = (completed / total_orders * 100) if total_orders else 50.0
    dispute_rate_raw = (disputed / total_orders * 100) if total_orders else 0
    refund_rate_raw = (refunded / total_orders * 100) if total_orders else 0

    distinct_customers = orders.values("customer").distinct().count()
    repeat = max(0, total_orders - distinct_customers)
    repeat_rate = (repeat / total_orders * 100) if total_orders else 0

    months_active = (timezone.now() - printer.created_at).days / 30
    catalog_count = printer.price_grids.filter(is_active=True).count()
    zones_count = printer.delivery_zones.count()

    load = float(printer.current_load_pct)
    capacity_score = 100 if 60 <= load <= 80 else max(0, 100 - abs(70 - load) * 2)
    kyb_score = 100 if printer.kyc_status == "approved" else 50

    breakdown = ScoreBreakdown(
        quality=quality,
        on_time=float(printer.on_time_rate),
        response_time=_normalize(printer.response_time_minutes, 120, invert=True),
        completion_rate=completion_rate,
        reviews_volume=_normalize(reviews_count, 100),
        seniority=_normalize(months_active, 24),
        kyb_strength=kyb_score,
        capacity_usage=capacity_score,
        dispute_rate=_normalize(dispute_rate_raw, 20, invert=True),
        refund_rate=_normalize(refund_rate_raw, 10, invert=True),
        repeat_customer=_normalize(repeat_rate, 40),
        catalog_depth=_normalize(catalog_count, 50),
        geo_coverage=_normalize(zones_count, 10),
        care_eligible=100 if float(printer.quality_score) >= 80 else 0,
        express_capable=100 if load < 70 else 0,
    )

    weighted = sum(getattr(breakdown, k) * SCORE_WEIGHTS[k] for k in SCORE_WEIGHTS)
    score_1000 = int(weighted * 10)

    return {
        "score": score_1000,
        "score_100": round(weighted, 1),
        "badge": badge_for_score(score_1000),
        "breakdown": asdict(breakdown),
        "weights": SCORE_WEIGHTS,
        "computed_at": timezone.now().isoformat(),
    }


def badge_for_score(score: int) -> str:
    if score >= 850:
        return "platinum"
    if score >= 700:
        return "gold"
    if score >= 550:
        return "silver"
    if score >= 400:
        return "bronze"
    return "newcomer"


def badge_label(badge: str) -> str:
    labels = {
        "platinum": "Platinum",
        "gold": "Or",
        "silver": "Argent",
        "bronze": "Bronze",
        "newcomer": "Nouveau",
    }
    return labels.get(badge, "")
