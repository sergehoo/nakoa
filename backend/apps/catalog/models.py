"""Catalogue produits PrintHub — catégories, produits, variantes, options."""

from __future__ import annotations

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Category(BaseModel):
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children",
    )
    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to="catalog/icons/", null=True, blank=True)
    cover = models.ImageField(upload_to="catalog/categories/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["position", "name"]

    def __str__(self) -> str:
        return self.name


class Product(BaseModel):
    """Modèle produit générique (ex : Flyer A5)."""

    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    slug = models.SlugField(max_length=180, unique=True)
    name = models.CharField(max_length=160)
    short_description = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="catalog/products/", null=True, blank=True)

    specifications = models.JSONField(default=dict, blank=True)
    min_quantity = models.PositiveIntegerField(default=1)
    max_quantity = models.PositiveIntegerField(default=1000000)
    lead_time_days = models.PositiveIntegerField(default=3)

    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    tags = models.JSONField(default=list, blank=True)
    base_template_url = models.URLField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["is_featured", "is_active"]),
        ]
        ordering = ["sort_order", "name"]

    def __str__(self) -> str:
        return self.name


class ProductOption(BaseModel):
    """Option configurable d'un produit (Format, Papier, Finition…)."""

    class Kind(models.TextChoices):
        FORMAT = "format", _("Format")
        PAPER = "paper", _("Papier")
        WEIGHT = "weight", _("Grammage")
        COLOR = "color", _("Couleurs")
        FINISH = "finish", _("Finition")
        BINDING = "binding", _("Reliure")
        FOLD = "fold", _("Pliage")
        QUANTITY = "quantity", _("Quantité")
        OTHER = "other", _("Autre")

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="options")
    kind = models.CharField(max_length=24, choices=Kind.choices)
    name = models.CharField(max_length=120)
    required = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]


class ProductOptionValue(BaseModel):
    option = models.ForeignKey(ProductOption, on_delete=models.CASCADE, related_name="values")
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=120)
    extra_cost_pct = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0"))
    extra_cost_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    metadata = models.JSONField(default=dict, blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["option", "code"], name="uq_option_value"),
        ]


class ProductImage(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="catalog/products/")
    alt = models.CharField(max_length=255, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["position"]


class ProductTemplate(BaseModel):
    """Gabarits téléchargeables (PDF, AI, IDML…)."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="templates")
    name = models.CharField(max_length=120)
    file = models.FileField(upload_to="catalog/templates/")
    format = models.CharField(max_length=16)
