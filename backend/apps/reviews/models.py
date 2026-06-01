"""Avis client après livraison + réponse imprimeur."""

from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Review(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", _("En attente modération")
        PUBLISHED = "published", _("Publié")
        HIDDEN = "hidden", _("Masqué")
        REJECTED = "rejected", _("Rejeté")

    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="review")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reviews",
    )
    printer = models.ForeignKey("printers.PrinterProfile", on_delete=models.CASCADE, related_name="reviews")
    overall_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    quality_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    delivery_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    communication_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=160, blank=True)
    body = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PUBLISHED)
    printer_response = models.TextField(blank=True)
    printer_response_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["printer", "status", "overall_rating"]),
        ]
