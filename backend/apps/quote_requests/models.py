"""Demandes de devis — exprime un besoin client, déclenche le matching."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country, Currency


class QuoteStatus(models.TextChoices):
    DRAFT = "draft", _("Brouillon")
    OPEN = "open", _("Ouverte")
    MATCHED = "matched", _("Offres reçues")
    SELECTED = "selected", _("Offre sélectionnée")
    CONVERTED = "converted", _("Convertie en commande")
    EXPIRED = "expired", _("Expirée")
    CANCELLED = "cancelled", _("Annulée")


class QuoteRequest(BaseModel):
    reference = models.CharField(max_length=24, unique=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quote_requests",
    )
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="quote_requests")
    quantity = models.PositiveIntegerField()
    option_values = models.ManyToManyField("catalog.ProductOptionValue", blank=True)

    budget_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    budget_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)
    desired_delivery_at = models.DateTimeField(null=True, blank=True)
    delivery_country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    delivery_city = models.CharField(max_length=120, blank=True)
    delivery_address = models.CharField(max_length=255, blank=True)

    customer_notes = models.TextField(blank=True)
    initial_bat_file = models.FileField(upload_to="quotes/bat/", null=True, blank=True)
    reference_files = models.JSONField(default=list, blank=True)

    status = models.CharField(max_length=16, choices=QuoteStatus.choices, default=QuoteStatus.DRAFT)
    selected_offer = models.ForeignKey(
        "QuoteOffer", null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    matched_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["customer", "status", "created_at"]),
            models.Index(fields=["status", "expires_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.reference


class QuoteOffer(BaseModel):
    """Offre faite par un imprimeur sur une QuoteRequest."""

    class Tag(models.TextChoices):
        RECOMMENDED = "recommended", _("Recommandée IA")
        BEST_PRICE = "best_price", _("Meilleur prix")
        FASTEST = "fastest", _("Plus rapide")
        PREMIUM = "premium", _("Premium")
        NEAREST = "nearest", _("Le plus proche")
        STANDARD = "standard", _("Standard")

    request = models.ForeignKey(QuoteRequest, on_delete=models.CASCADE, related_name="offers")
    printer = models.ForeignKey("printers.PrinterProfile", on_delete=models.CASCADE, related_name="quote_offers")
    price_grid = models.ForeignKey(
        "pricing.PriceGrid", null=True, blank=True, on_delete=models.SET_NULL, related_name="offers",
    )

    total_excl_tax = models.DecimalField(max_digits=15, decimal_places=2)
    total_incl_tax = models.DecimalField(max_digits=15, decimal_places=2)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)

    delivery_fee = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    expected_delivery_at = models.DateTimeField(null=True, blank=True)
    estimated_lead_time_days = models.PositiveIntegerField(default=0)

    score = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    tag = models.CharField(max_length=24, choices=Tag.choices, default=Tag.STANDARD)
    is_ai_recommended = models.BooleanField(default=False)
    quality_score_snapshot = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))

    breakdown = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-score", "total_incl_tax"]
        indexes = [
            models.Index(fields=["request", "tag"]),
            models.Index(fields=["printer", "is_active"]),
        ]
