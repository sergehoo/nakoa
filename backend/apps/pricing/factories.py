"""Factories pour les grilles tarifaires."""

from __future__ import annotations

from decimal import Decimal

import factory
from factory.django import DjangoModelFactory

from .models import PriceGrid, PriceModifier, PriceTier, PromoCode


class PriceGridFactory(DjangoModelFactory):
    class Meta:
        model = PriceGrid

    currency = "XOF"
    base_setup_cost = Decimal("5000")
    base_unit_cost = Decimal("50")
    vat_rate = Decimal("18")
    is_active = True


class PriceTierFactory(DjangoModelFactory):
    class Meta:
        model = PriceTier

    min_quantity = 100
    unit_price = Decimal("50")
    discount_pct = Decimal("0")


class PromoCodeFactory(DjangoModelFactory):
    class Meta:
        model = PromoCode
        django_get_or_create = ("code",)

    code = factory.Sequence(lambda n: f"PROMO{n:03d}")
    discount_pct = Decimal("10")
    flat_amount = Decimal("0")
    min_basket = Decimal("0")
    max_uses = 100
    is_active = True
