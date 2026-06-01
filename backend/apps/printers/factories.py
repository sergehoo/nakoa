"""Factories pour les imprimeurs."""

from __future__ import annotations

from decimal import Decimal

import factory
from factory.django import DjangoModelFactory
from django.contrib.gis.geos import Point
from django.utils.text import slugify

from apps.accounts.factories import PrinterOwnerFactory

from .models import DeliveryZone, Finish, Machine, PrinterProfile, PrinterStatus


class PrinterProfileFactory(DjangoModelFactory):
    class Meta:
        model = PrinterProfile
        django_get_or_create = ("slug",)

    owner = factory.SubFactory(PrinterOwnerFactory)
    legal_name = factory.Sequence(lambda n: f"Imprimerie {n} SARL")
    trade_name = factory.LazyAttribute(lambda o: o.legal_name.replace(" SARL", ""))
    slug = factory.LazyAttribute(lambda o: slugify(o.trade_name))
    description = factory.Faker("paragraph", locale="fr_FR")
    rccm_number = factory.Sequence(lambda n: f"CI-ABJ-{2020 + n}-B-{1000 + n}")
    tax_id = factory.Sequence(lambda n: f"CC{1000000 + n}")
    country = "CI"
    city = "Abidjan"
    address = factory.Faker("street_address", locale="fr_FR")
    geo_point = factory.LazyAttribute(lambda _: Point(-4.024, 5.345))  # Abidjan
    delivery_radius_km = Decimal("25")
    daily_capacity_units = 5000
    current_load_pct = Decimal("45")
    quality_score = Decimal("85")
    on_time_rate = Decimal("92")
    response_time_minutes = 30
    status = PrinterStatus.ACTIVE
    kyc_status = "approved"
    is_featured = False
    wallet_balance = Decimal("0")
    business_hours = {
        "mon": {"open": "08:00", "close": "18:00"},
        "tue": {"open": "08:00", "close": "18:00"},
        "wed": {"open": "08:00", "close": "18:00"},
        "thu": {"open": "08:00", "close": "18:00"},
        "fri": {"open": "08:00", "close": "18:00"},
        "sat": {"open": "09:00", "close": "13:00"},
    }


class MachineFactory(DjangoModelFactory):
    class Meta:
        model = Machine

    name = "HP Indigo 7900"
    kind = Machine.Kind.DIGITAL
    manufacturer = "HP"
    model = "Indigo 7900"
    max_format = "70x100"
    capacity_per_hour = 4000
    is_active = True


class FinishFactory(DjangoModelFactory):
    class Meta:
        model = Finish

    code = "vernis"
    label = "Vernis brillant"
    description = "Vernis UV brillant pour finition premium"
    unit_cost = Decimal("50")
    setup_cost = Decimal("5000")
    is_active = True


class DeliveryZoneFactory(DjangoModelFactory):
    class Meta:
        model = DeliveryZone

    name = "Abidjan centre"
    country = "CI"
    city = "Abidjan"
    base_fee = Decimal("2500")
    per_km_fee = Decimal("200")
    free_above_amount = Decimal("100000")
    estimated_delay_hours = 24
