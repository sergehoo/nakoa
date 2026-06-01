"""Transporteurs, expéditions, tournées."""

from __future__ import annotations

from decimal import Decimal

from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country, Currency


class Carrier(BaseModel):
    name = models.CharField(max_length=120)
    code = models.SlugField(max_length=80, unique=True)
    countries = models.JSONField(default=list, blank=True)
    is_internal = models.BooleanField(default=False, help_text="Livreurs internes PrintHub")
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    per_km_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    is_active = models.BooleanField(default=True)


class Shipment(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", _("À prendre en charge")
        PICKED_UP = "picked_up", _("Pris en charge")
        IN_TRANSIT = "in_transit", _("En transit")
        OUT_FOR_DELIVERY = "out_for_delivery", _("En livraison")
        DELIVERED = "delivered", _("Livrée")
        FAILED = "failed", _("Échec")
        RETURNED = "returned", _("Retournée")

    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="shipment")
    carrier = models.ForeignKey(Carrier, null=True, blank=True, on_delete=models.SET_NULL, related_name="shipments")
    tracking_number = models.CharField(max_length=80, unique=True, blank=True)
    pickup_address = models.JSONField(default=dict, blank=True)
    drop_address = models.JSONField(default=dict, blank=True)
    pickup_point = gis_models.PointField(null=True, blank=True)
    drop_point = gis_models.PointField(null=True, blank=True)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.PENDING)
    cost = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    eta = models.DateTimeField(null=True, blank=True)


class Route(BaseModel):
    """Tournée groupant plusieurs Shipments."""

    carrier = models.ForeignKey(Carrier, on_delete=models.CASCADE, related_name="routes")
    driver = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL,
        related_name="driven_routes"
    )
    shipments = models.ManyToManyField(Shipment, related_name="routes")
    planned_at = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
