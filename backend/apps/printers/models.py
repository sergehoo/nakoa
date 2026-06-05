"""Modèles de l'app imprimeurs."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country


class PrinterStatus(models.TextChoices):
    PENDING = "pending", _("En attente KYB")
    ACTIVE = "active", _("Actif")
    PROBATION = "probation", _("En probation")
    SUSPENDED = "suspended", _("Suspendu")
    BANNED = "banned", _("Banni")


class PrinterProfile(BaseModel):
    """Fiche imprimeur partenaire."""

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="printer_profile",
    )

    legal_name = models.CharField(max_length=160)
    trade_name = models.CharField(max_length=160, blank=True)
    slug = models.SlugField(max_length=180, unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="printers/logos/", null=True, blank=True)
    banner = models.ImageField(upload_to="printers/banners/", null=True, blank=True)

    rccm_number = models.CharField(max_length=64, blank=True)
    tax_id = models.CharField(max_length=64, blank=True)
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    city = models.CharField(max_length=120, blank=True)
    address = models.CharField(max_length=255, blank=True)
    geo_point = gis_models.PointField(null=True, blank=True, spatial_index=True)
    delivery_radius_km = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("25"))

    daily_capacity_units = models.PositiveIntegerField(default=1000)
    current_load_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    quality_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    on_time_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0"))
    response_time_minutes = models.PositiveIntegerField(default=60)

    kyc_status = models.CharField(max_length=16, default="pending")
    status = models.CharField(max_length=16, choices=PrinterStatus.choices, default=PrinterStatus.PENDING)
    is_featured = models.BooleanField(default=False)

    wallet_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    subscription = models.ForeignKey(
        "subscriptions.Subscription", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="printers",
    )

    business_hours = models.JSONField(default=dict, blank=True, help_text="{'mon': {'open': '08:00', 'close': '18:00'}, ...}")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Imprimeur"
        verbose_name_plural = "Imprimeurs"
        indexes = [
            models.Index(fields=["status", "country"]),
            models.Index(fields=["quality_score"]),
            models.Index(fields=["is_featured", "status"]),
        ]

    def __str__(self) -> str:
        return self.trade_name or self.legal_name


class Machine(BaseModel):
    class Kind(models.TextChoices):
        OFFSET = "offset", _("Offset")
        DIGITAL = "digital", _("Numérique")
        LARGE_FORMAT = "large_format", _("Grand format")
        SCREEN = "screen", _("Sérigraphie")
        FLEXO = "flexo", _("Flexographie")
        FINISHING = "finishing", _("Finition")
        BINDING = "binding", _("Reliure")

    printer = models.ForeignKey(PrinterProfile, on_delete=models.CASCADE, related_name="machines")
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=24, choices=Kind.choices)
    manufacturer = models.CharField(max_length=120, blank=True)
    model = models.CharField(max_length=120, blank=True)
    max_format = models.CharField(max_length=32, blank=True, help_text="ex: 70x100, A3, B2…")
    capacity_per_hour = models.PositiveIntegerField(default=0)
    capabilities = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)


class Finish(BaseModel):
    printer = models.ForeignKey(PrinterProfile, on_delete=models.CASCADE, related_name="finishes")
    code = models.CharField(max_length=64)
    label = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    setup_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["printer", "code"], name="uq_printer_finish"),
        ]


class DeliveryZone(BaseModel):
    printer = models.ForeignKey(PrinterProfile, on_delete=models.CASCADE, related_name="delivery_zones")
    name = models.CharField(max_length=120)
    country = models.CharField(max_length=8, choices=Country.choices)
    city = models.CharField(max_length=120, blank=True)
    polygon = gis_models.PolygonField(null=True, blank=True)
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    per_km_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    free_above_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    estimated_delay_hours = models.PositiveIntegerField(default=24)


class ProductionCapability(BaseModel):
    """Mapping d'une catégorie/produit du catalogue avec un imprimeur."""

    printer = models.ForeignKey(PrinterProfile, on_delete=models.CASCADE, related_name="capabilities")
    category = models.ForeignKey("catalog.Category", on_delete=models.CASCADE, related_name="capable_printers")
    is_preferred = models.BooleanField(default=False)
    lead_time_days_min = models.PositiveIntegerField(default=1)
    lead_time_days_max = models.PositiveIntegerField(default=5)
    min_quantity = models.PositiveIntegerField(default=1)
    max_quantity = models.PositiveIntegerField(default=100000)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["printer", "category"], name="uq_printer_category"),
        ]


class PrinterAgent(BaseModel):
    """Salarié de l'imprimeur avec accès à PrintHub."""

    printer = models.ForeignKey(PrinterProfile, on_delete=models.CASCADE, related_name="agents")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="printer_agent")
    role = models.CharField(max_length=64, default="operator")
    can_manage_orders = models.BooleanField(default=True)
    can_manage_pricing = models.BooleanField(default=False)
    can_manage_team = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)


class PrinterProduct(BaseModel):
    """Association imprimeur ↔ produit du catalogue central Nakoa.

    Le catalogue (apps.catalog.Product) est partagé. Chaque imprimeur active
    uniquement les produits qu'il sait fabriquer et y associe ses propres
    prix, délais, capacités et options techniques.
    """

    printer = models.ForeignKey(
        PrinterProfile, on_delete=models.CASCADE, related_name="printer_products",
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="printer_offerings",
    )

    # Prix de base
    min_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    setup_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0"))
    currency = models.CharField(max_length=8, default="XOF")

    # Capacité & délais
    daily_capacity = models.PositiveIntegerField(default=1000)
    standard_lead_time_days = models.PositiveIntegerField(default=3)
    express_lead_time_days = models.PositiveIntegerField(default=1)
    express_surcharge_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("30"))

    # Options techniques (jsonb)
    supported_formats = models.JSONField(default=list, blank=True)
    supported_finishes = models.JSONField(default=list, blank=True)
    supported_papers = models.JSONField(default=list, blank=True)
    custom_options = models.JSONField(default=dict, blank=True)

    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_express_available = models.BooleanField(default=False)

    # Stats (mises à jour par signal/job)
    orders_count = models.PositiveIntegerField(default=0)
    last_order_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["printer", "product"], name="uq_printer_product",
            ),
        ]
        indexes = [
            models.Index(fields=["printer", "is_active"]),
            models.Index(fields=["product", "is_active"]),
        ]
        ordering = ["-is_active", "-orders_count", "-created_at"]

    def __str__(self) -> str:
        return f"{self.printer.trade_name or self.printer.legal_name} — {self.product.name}"
