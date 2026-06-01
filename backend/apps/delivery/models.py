"""Tracking GPS livreur, preuves de livraison, signature."""

from __future__ import annotations

from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class DeliveryAssignment(BaseModel):
    class Status(models.TextChoices):
        ASSIGNED = "assigned", _("Assignée")
        ACCEPTED = "accepted", _("Acceptée")
        PICKED_UP = "picked_up", _("Colis récupéré")
        IN_PROGRESS = "in_progress", _("En cours")
        DELIVERED = "delivered", _("Livrée")
        FAILED = "failed", _("Échouée")
        CANCELLED = "cancelled", _("Annulée")

    shipment = models.OneToOneField(
        "logistics.Shipment", on_delete=models.CASCADE, related_name="assignment",
    )
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="delivery_assignments",
    )
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.ASSIGNED)
    assigned_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)


class GPSPoint(BaseModel):
    """Position GPS du livreur en temps réel."""

    assignment = models.ForeignKey(
        DeliveryAssignment, on_delete=models.CASCADE, related_name="gps_points",
    )
    location = gis_models.PointField()
    speed_kmh = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    heading = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    accuracy_m = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    recorded_at = models.DateTimeField(db_index=True)


class DeliveryProof(BaseModel):
    class Kind(models.TextChoices):
        PHOTO = "photo", _("Photo")
        SIGNATURE = "signature", _("Signature")
        QR_SCAN = "qr_scan", _("Scan QR")
        ID_CHECK = "id_check", _("Pièce d'identité")

    assignment = models.OneToOneField(
        DeliveryAssignment, on_delete=models.CASCADE, related_name="proof",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices)
    image = models.ImageField(upload_to="delivery/proofs/", null=True, blank=True)
    signature_svg = models.TextField(blank=True)
    receiver_name = models.CharField(max_length=160, blank=True)
    receiver_phone = models.CharField(max_length=40, blank=True)
    notes = models.TextField(blank=True)
    location = gis_models.PointField(null=True, blank=True)
