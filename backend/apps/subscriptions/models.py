"""Abonnements SaaS imprimeur : Basic, Pro, Premium, Enterprise."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Currency


class Plan(BaseModel):
    class Tier(models.TextChoices):
        BASIC = "basic", _("Basic")
        PRO = "pro", _("Pro")
        PREMIUM = "premium", _("Premium")
        ENTERPRISE = "enterprise", _("Enterprise")

    tier = models.CharField(max_length=16, choices=Tier.choices, unique=True)
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    monthly_price = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    yearly_price = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)

    commission_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("15"))
    max_active_orders = models.PositiveIntegerField(default=10)
    max_team_members = models.PositiveIntegerField(default=2)
    max_products = models.PositiveIntegerField(default=20)
    ai_messages_per_month = models.PositiveIntegerField(default=50)

    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)


class Subscription(BaseModel):
    class Status(models.TextChoices):
        TRIAL = "trial", _("Essai gratuit")
        ACTIVE = "active", _("Active")
        PAST_DUE = "past_due", _("Impayée")
        CANCELLED = "cancelled", _("Annulée")
        EXPIRED = "expired", _("Expirée")

    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", _("Mensuel")
        YEARLY = "yearly", _("Annuel")

    subscriber = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions",
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    cycle = models.CharField(max_length=16, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.TRIAL)

    started_at = models.DateTimeField()
    current_period_end = models.DateTimeField()
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    provider_reference = models.CharField(max_length=160, blank=True)
    auto_renew = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["subscriber", "status"]),
            models.Index(fields=["status", "current_period_end"]),
        ]
