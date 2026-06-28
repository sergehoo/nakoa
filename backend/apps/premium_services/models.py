"""Modèles des services premium add-ons."""

from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, UUIDPKModel, TimeStampedModel


# ============================================================
# Catégorie
# ============================================================
class ServiceCategory(BaseModel):
    name = models.CharField(_("nom"), max_length=120)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.TextField(_("description"), blank=True, default="")
    icon = models.CharField(_("icône"), max_length=64, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=100, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ("sort_order", "name")
        verbose_name = _("Catégorie de service")
        verbose_name_plural = _("Catégories de services")

    def __str__(self) -> str:
        return self.name


# ============================================================
# Service premium
# ============================================================
class PremiumService(BaseModel):
    class PricingType(models.TextChoices):
        FIXED = "fixed", _("Prix fixe")
        PER_UNIT = "per_unit", _("Prix par unité")
        VARIABLE = "variable", _("Variable (devis)")
        PERCENTAGE = "percentage", _("Pourcentage du total commande")

    category = models.ForeignKey(
        ServiceCategory, on_delete=models.PROTECT, related_name="services",
        null=True, blank=True,
    )

    code = models.SlugField(max_length=80, unique=True, db_index=True)
    name = models.CharField(_("nom"), max_length=200)
    description = models.TextField(_("description"), blank=True, default="")
    short_description = models.CharField(
        _("description courte"), max_length=200, blank=True, default="",
    )
    icon = models.CharField(_("icône"), max_length=64, blank=True, default="")

    pricing_type = models.CharField(
        _("type de tarification"), max_length=16,
        choices=PricingType.choices, default=PricingType.FIXED,
    )
    base_price = models.DecimalField(
        _("prix de base"), max_digits=15, decimal_places=2, default=Decimal("0"),
        help_text=_("Prix fixe ou prix unitaire selon le type."),
    )
    percentage = models.DecimalField(
        _("pourcentage"), max_digits=6, decimal_places=4, default=Decimal("0"),
        help_text=_("0.05 = 5% du total commande (si pricing_type=percentage)."),
    )
    currency = models.CharField(max_length=8, default="XOF")

    # Disponibilité
    is_active = models.BooleanField(default=True, db_index=True)
    is_visible = models.BooleanField(_("visible client"), default=True, db_index=True)
    is_required = models.BooleanField(
        _("obligatoire"), default=False,
        help_text=_("Si True, automatiquement ajouté à toute commande."),
    )

    # Estimation délai
    estimated_hours = models.PositiveIntegerField(
        _("durée estimée (h)"), default=0,
        help_text=_("Délai supplémentaire à prévoir."),
    )

    # Ciblage : ces catégories de produits sont concernées (vide = toutes)
    applies_to_categories = models.JSONField(
        _("catégories concernées"), default=list, blank=True,
        help_text=_("Liste de slugs de catégories produits. Vide = applicable partout."),
    )

    sort_order = models.PositiveIntegerField(default=100, db_index=True)

    class Meta(BaseModel.Meta):
        ordering = ("sort_order", "name")
        verbose_name = _("Service premium")
        verbose_name_plural = _("Services premium")
        indexes = [
            models.Index(fields=["is_visible", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name


# ============================================================
# Liaison commande ↔ service
# ============================================================
class OrderService(UUIDPKModel, TimeStampedModel):
    """Un service ajouté à une commande."""

    class Status(models.TextChoices):
        PENDING = "pending", _("En attente")
        IN_PROGRESS = "in_progress", _("En cours")
        DELIVERED = "delivered", _("Livré")
        REFUNDED = "refunded", _("Remboursé")

    order_id = models.UUIDField(db_index=True)
    service = models.ForeignKey(
        PremiumService, on_delete=models.PROTECT, related_name="orders",
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    total = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=8, default="XOF")

    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True,
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Service commandé")
        verbose_name_plural = _("Services commandés")
        indexes = [
            models.Index(fields=["order_id", "status"]),
        ]
