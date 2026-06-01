"""Grilles tarifaires imprimeur + paliers de quantité."""

from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Currency


class PriceGrid(BaseModel):
    printer = models.ForeignKey("printers.PrinterProfile", on_delete=models.CASCADE, related_name="price_grids")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="price_grids")
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)
    base_setup_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    base_unit_cost = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal("0"))
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["printer", "product"], name="uq_pricegrid_printer_product",
            ),
        ]


class PriceTier(BaseModel):
    """Palier de remise par quantité."""

    grid = models.ForeignKey(PriceGrid, on_delete=models.CASCADE, related_name="tiers")
    min_quantity = models.PositiveIntegerField()
    max_quantity = models.PositiveIntegerField(null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=4)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))

    class Meta:
        ordering = ["min_quantity"]


class PriceModifier(BaseModel):
    """Modificateur lié à un OptionValue (ex : finition vernis +10 %)."""

    class Kind(models.TextChoices):
        PERCENT = "percent", _("Pourcentage")
        FLAT = "flat", _("Forfait")
        PER_UNIT = "per_unit", _("Par unité")

    grid = models.ForeignKey(PriceGrid, on_delete=models.CASCADE, related_name="modifiers")
    option_value = models.ForeignKey(
        "catalog.ProductOptionValue", on_delete=models.CASCADE, related_name="price_modifiers",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["grid", "option_value"], name="uq_modifier_grid_optval"),
        ]


class PromoCode(BaseModel):
    code = models.CharField(max_length=32, unique=True)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    flat_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    min_basket = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    max_uses = models.PositiveIntegerField(default=0, help_text="0 = illimité")
    uses = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
