"""Factories pour les commandes."""

from __future__ import annotations

from decimal import Decimal

import factory
from factory.django import DjangoModelFactory

from apps.core.utils import generate_reference, percent

from .models import Order, OrderStatus


class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order
        django_get_or_create = ("reference",)

    reference = factory.LazyFunction(lambda: generate_reference("PH"))
    quantity = 500
    unit_price_excl_tax = Decimal("60")
    total_excl_tax = Decimal("30000")
    vat_rate = Decimal("18")
    vat_amount = Decimal("5400")
    total_incl_tax = Decimal("35400")
    delivery_fee = Decimal("2500")
    discount_amount = Decimal("0")
    platform_commission = factory.LazyAttribute(lambda o: percent(o.total_excl_tax, Decimal("10")))
    printer_payout = factory.LazyAttribute(lambda o: o.total_excl_tax - o.platform_commission)
    currency = "XOF"
    delivery_country = "CI"
    status = OrderStatus.DRAFT
    customer_notes = ""
    delivery_address = {"country": "CI", "city": "Abidjan", "address": "Boulevard Latrille"}
