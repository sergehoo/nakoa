"""Calcul de prix à partir d'une grille imprimeur + options sélectionnées."""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Iterable

from apps.core.utils import safe_decimal

from ..models import PriceGrid, PriceModifier, PriceTier


@dataclass
class PriceLine:
    label: str
    amount: Decimal


@dataclass
class PriceQuote:
    subtotal: Decimal
    setup: Decimal
    options_total: Decimal
    discount: Decimal
    vat: Decimal
    total_excl_tax: Decimal
    total_incl_tax: Decimal
    unit_price: Decimal
    currency: str
    breakdown: list[PriceLine] = field(default_factory=list)


class PriceCalculator:
    """Calcul de prix à partir d'une PriceGrid imprimeur."""

    def __init__(self, grid: PriceGrid):
        self.grid = grid

    def _find_tier(self, quantity: int) -> PriceTier | None:
        tiers = list(self.grid.tiers.all())
        for t in tiers:
            if quantity >= t.min_quantity and (t.max_quantity is None or quantity <= t.max_quantity):
                return t
        return tiers[0] if tiers else None

    def _apply_modifiers(
        self, base_unit: Decimal, quantity: int, option_value_ids: Iterable
    ) -> tuple[Decimal, list[PriceLine]]:
        total = Decimal("0")
        lines: list[PriceLine] = []
        modifiers = self.grid.modifiers.filter(option_value_id__in=list(option_value_ids))
        for m in modifiers:
            if m.kind == PriceModifier.Kind.PERCENT:
                amount = (base_unit * quantity) * safe_decimal(m.amount) / Decimal("100")
            elif m.kind == PriceModifier.Kind.PER_UNIT:
                amount = safe_decimal(m.amount) * quantity
            else:  # FLAT
                amount = safe_decimal(m.amount)
            total += amount
            lines.append(PriceLine(label=f"Option {m.option_value.label}", amount=amount.quantize(Decimal("0.01"))))
        return total.quantize(Decimal("0.01")), lines

    def quote(
        self,
        quantity: int,
        option_value_ids: Iterable | None = None,
        discount_pct: Decimal | float | int = 0,
    ) -> PriceQuote:
        option_value_ids = option_value_ids or []
        tier = self._find_tier(quantity)
        unit_base = safe_decimal(tier.unit_price if tier else self.grid.base_unit_cost)

        setup = safe_decimal(self.grid.base_setup_cost)
        subtotal = (unit_base * quantity).quantize(Decimal("0.01"))

        options_total, breakdown = self._apply_modifiers(unit_base, quantity, option_value_ids)

        gross = setup + subtotal + options_total
        discount = (gross * safe_decimal(discount_pct) / Decimal("100")).quantize(Decimal("0.01"))
        total_excl = (gross - discount).quantize(Decimal("0.01"))
        vat = (total_excl * safe_decimal(self.grid.vat_rate) / Decimal("100")).quantize(Decimal("0.01"))
        total_incl = (total_excl + vat).quantize(Decimal("0.01"))
        unit_price = (total_excl / quantity).quantize(Decimal("0.01")) if quantity else Decimal("0.00")

        breakdown = [
            PriceLine("Configuration (setup)", setup),
            PriceLine(f"Quantité × prix unitaire ({quantity} × {unit_base})", subtotal),
            *breakdown,
            PriceLine("Remise", -discount),
            PriceLine(f"TVA {self.grid.vat_rate}%", vat),
        ]

        return PriceQuote(
            subtotal=subtotal,
            setup=setup,
            options_total=options_total,
            discount=discount,
            vat=vat,
            total_excl_tax=total_excl,
            total_incl_tax=total_incl,
            unit_price=unit_price,
            currency=self.grid.currency,
            breakdown=breakdown,
        )
