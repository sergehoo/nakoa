from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country


class CustomerSegment(models.TextChoices):
    INDIVIDUAL = "individual", _("Particulier")
    SMB = "smb", _("PME")
    AGENCY = "agency", _("Agence")
    NGO = "ngo", _("ONG")
    PUBLIC = "public", _("Public")
    ENTERPRISE = "enterprise", _("Grand compte")


class CustomerProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_profile",
    )
    segment = models.CharField(max_length=16, choices=CustomerSegment.choices, default=CustomerSegment.INDIVIDUAL)
    company_name = models.CharField(max_length=160, blank=True)
    tax_id = models.CharField(max_length=64, blank=True)
    industry = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)

    loyalty_points = models.PositiveIntegerField(default=0)
    lifetime_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    total_orders = models.PositiveIntegerField(default=0)
    last_order_at = models.DateTimeField(null=True, blank=True)

    tags = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["segment", "country"]),
            models.Index(fields=["last_order_at"]),
        ]

    def __str__(self) -> str:
        return self.company_name or self.user.full_name


class CustomerCompany(BaseModel):
    """Compte entreprise multi-utilisateurs."""

    name = models.CharField(max_length=160)
    legal_name = models.CharField(max_length=160, blank=True)
    rccm_number = models.CharField(max_length=64, blank=True)
    tax_id = models.CharField(max_length=64, blank=True)
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    billing_email = models.EmailField(blank=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="CustomerCompanyMember",
        through_fields=("company", "user"),
        related_name="customer_companies",
    )
    credit_limit = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    payment_terms_days = models.PositiveIntegerField(default=0)


class CustomerCompanyMember(BaseModel):
    class Role(models.TextChoices):
        OWNER = "owner", _("Propriétaire")
        ADMIN = "admin", _("Administrateur")
        BUYER = "buyer", _("Acheteur")
        ACCOUNTANT = "accountant", _("Comptable")
        VIEWER = "viewer", _("Observateur")

    company = models.ForeignKey(CustomerCompany, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.BUYER)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["company", "user"], name="uq_company_user"),
        ]
