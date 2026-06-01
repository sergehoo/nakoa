"""Moteur de matching v2 — multi-critères avec géo réelle PostGIS.

Améliorations vs v1 :
- Distance réelle via PostGIS (Distance + ST_DistanceSphere)
- Pondération adaptative selon préférences client (budget, urgence)
- Pénalité non-linéaire pour imprimeurs en surcharge (current_load_pct > 70)
- Bonus expert pour catégorie préférée (is_preferred=True sur capability)
- Tri stable par score + tie-breaker prix ascendant
- Tag NEAREST en plus de RECOMMENDED / BEST_PRICE / FASTEST
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable

from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point
from django.db import transaction
from django.utils import timezone

from apps.core.utils import safe_decimal
from apps.pricing.models import PriceGrid
from apps.pricing.services import PriceCalculator
from apps.printers.models import PrinterProfile, PrinterStatus
from apps.quote_requests.models import (
    QuoteOffer,
    QuoteRequest,
    QuoteStatus,
)

from ..models import MatchingRun


DEFAULT_WEIGHTS = {
    "price": 0.25, "lead_time": 0.20, "distance": 0.10, "quality": 0.15,
    "on_time": 0.10, "load": 0.10, "specialty": 0.05, "reputation": 0.05,
}

URGENCY_WEIGHTS = {
    "price": 0.15, "lead_time": 0.35, "distance": 0.10, "quality": 0.15,
    "on_time": 0.10, "load": 0.05, "specialty": 0.05, "reputation": 0.05,
}

BUDGET_WEIGHTS = {
    "price": 0.40, "lead_time": 0.10, "distance": 0.10, "quality": 0.15,
    "on_time": 0.10, "load": 0.05, "specialty": 0.05, "reputation": 0.05,
}


@dataclass
class Candidate:
    printer: PrinterProfile
    grid: PriceGrid
    total_excl_tax: Decimal
    total_incl_tax: Decimal
    unit_price: Decimal
    lead_time_days: int
    distance_km: float
    score: float = 0.0
    breakdown: list[dict] | None = None


class MatchingEngine:
    def __init__(self, request: QuoteRequest, weights: dict | None = None):
        self.request = request
        self.weights = weights or self._select_weights(request)

    @staticmethod
    def _select_weights(request: QuoteRequest) -> dict:
        if request.desired_delivery_at:
            delta = request.desired_delivery_at - timezone.now()
            if delta.days <= 2:
                return URGENCY_WEIGHTS
        if request.budget_max and request.quantity > 0:
            unit_budget = Decimal(request.budget_max) / Decimal(request.quantity)
            if unit_budget < Decimal("100"):
                return BUDGET_WEIGHTS
        return DEFAULT_WEIGHTS

    def _customer_geo(self) -> Point | None:
        # TODO : géocodage réel (Mapbox / OSM Nominatim) pour adresse précise
        country_centroids = {
            "CI": Point(-4.024, 5.345), "SN": Point(-17.467, 14.692),
            "BJ": Point(2.397, 6.367), "TG": Point(1.215, 6.137),
            "BF": Point(-1.524, 12.371), "ML": Point(-7.999, 12.639),
            "CM": Point(11.502, 3.848), "NE": Point(2.117, 13.512),
        }
        return country_centroids.get(self.request.delivery_country)

    def _eligible_printers(self):
        qs = (
            PrinterProfile.objects
            .filter(status=PrinterStatus.ACTIVE)
            .filter(capabilities__category=self.request.product.category)
            .distinct()
        )
        customer_geo = self._customer_geo()
        if customer_geo is not None:
            qs = qs.annotate(distance_to_customer=Distance("geo_point", customer_geo))
        return qs

    def _build_candidate(self, printer: PrinterProfile) -> Candidate | None:
        grid = PriceGrid.objects.filter(
            printer=printer, product=self.request.product, is_active=True,
        ).first()
        if not grid:
            return None
        calc = PriceCalculator(grid)
        option_value_ids = list(self.request.option_values.values_list("id", flat=True))
        result = calc.quote(quantity=self.request.quantity, option_value_ids=option_value_ids)
        capability = printer.capabilities.filter(category=self.request.product.category).first()
        lead = capability.lead_time_days_max if capability else 5
        distance = getattr(printer, "distance_to_customer", None)
        distance_km = float(distance.km) if distance else 25.0
        return Candidate(
            printer=printer, grid=grid,
            total_excl_tax=result.total_excl_tax,
            total_incl_tax=result.total_incl_tax,
            unit_price=result.unit_price,
            lead_time_days=lead, distance_km=distance_km,
            breakdown=[{"label": l.label, "amount": str(l.amount)} for l in result.breakdown],
        )

    def _score(self, c: Candidate, all_candidates: list[Candidate]) -> float:
        prices = [float(x.total_incl_tax) for x in all_candidates] or [0]
        leads = [x.lead_time_days for x in all_candidates] or [1]
        distances = [x.distance_km for x in all_candidates] or [1]

        def norm(value, values, invert=True):
            mn, mx = min(values), max(values)
            if mx == mn:
                return 1.0
            base = (value - mn) / (mx - mn)
            return 1.0 - base if invert else base

        score = 0.0
        score += self.weights["price"] * norm(float(c.total_incl_tax), prices)
        score += self.weights["lead_time"] * norm(c.lead_time_days, leads)
        score += self.weights["distance"] * norm(c.distance_km, distances)
        score += self.weights["quality"] * float(safe_decimal(c.printer.quality_score)) / 100
        score += self.weights["on_time"] * float(safe_decimal(c.printer.on_time_rate)) / 100
        load = float(safe_decimal(c.printer.current_load_pct))
        load_factor = 1.0 if load < 70 else max(0.0, (100 - load) / 30)
        score += self.weights["load"] * load_factor
        is_preferred = c.printer.capabilities.filter(
            category=self.request.product.category, is_preferred=True,
        ).exists()
        score += self.weights["specialty"] * (1.0 if is_preferred else 0.0)
        score += self.weights["reputation"] * 1.0
        return round(score * 100, 2)

    @transaction.atomic
    def run(self) -> list[QuoteOffer]:
        started = time.time()
        printers = list(self._eligible_printers())
        candidates: list[Candidate] = []
        for p in printers:
            c = self._build_candidate(p)
            if c:
                candidates.append(c)

        for c in candidates:
            c.score = self._score(c, candidates)

        candidates.sort(key=lambda x: (-x.score, float(x.total_incl_tax)))

        if candidates:
            cheapest = min(candidates, key=lambda x: x.total_incl_tax)
            fastest = min(candidates, key=lambda x: x.lead_time_days)
            nearest = min(candidates, key=lambda x: x.distance_km)
            recommended = candidates[0]
            tagged = {
                id(cheapest): QuoteOffer.Tag.BEST_PRICE,
                id(fastest): QuoteOffer.Tag.FASTEST,
                id(nearest): QuoteOffer.Tag.NEAREST,
                id(recommended): QuoteOffer.Tag.RECOMMENDED,
            }
        else:
            tagged = {}

        QuoteOffer.objects.filter(request=self.request).update(is_active=False)

        offers: list[QuoteOffer] = []
        for c in candidates[:5]:
            tag = tagged.get(id(c), QuoteOffer.Tag.STANDARD)
            offers.append(QuoteOffer.objects.create(
                request=self.request, printer=c.printer, price_grid=c.grid,
                total_excl_tax=c.total_excl_tax, total_incl_tax=c.total_incl_tax,
                unit_price=c.unit_price, currency=c.grid.currency,
                estimated_lead_time_days=c.lead_time_days,
                expected_delivery_at=timezone.now() + timezone.timedelta(days=c.lead_time_days),
                score=c.score, tag=tag,
                is_ai_recommended=(tag == QuoteOffer.Tag.RECOMMENDED),
                quality_score_snapshot=c.printer.quality_score,
                breakdown=c.breakdown or [],
            ))

        duration_ms = int((time.time() - started) * 1000)
        MatchingRun.objects.update_or_create(
            quote_request=self.request,
            defaults={
                "candidates_count": len(candidates),
                "weights": self.weights,
                "raw_scores": [
                    {"printer": str(c.printer_id), "score": c.score, "distance_km": c.distance_km}
                    for c in candidates
                ],
                "selected_offer_ids": [str(o.id) for o in offers],
                "duration_ms": duration_ms,
                "algorithm_version": "v2",
            },
        )

        self.request.status = QuoteStatus.MATCHED
        self.request.matched_at = timezone.now()
        self.request.save(update_fields=["status", "matched_at"])
        return offers
