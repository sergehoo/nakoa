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

    class TargetRole(models.TextChoices):
        ANY = "any", _("Tout le monde")
        CUSTOMER = "customer", _("Particuliers")
        CUSTOMER_CORPORATE = "customer_corporate", _("Entreprises")
        PRINTER = "printer", _("Imprimeurs")
        COURIER = "courier", _("Livreurs")

    # `tier` est désormais une catégorie (Basic/Pro/Premium/Enterprise) — plusieurs
    # plans peuvent partager le même tier (ex: printer-pro + corporate-team).
    # L'identifiant stable et unique est `code`.
    tier = models.CharField(max_length=16, choices=Tier.choices, db_index=True)
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

    # ------------------------------------------------------------
    # Extension Phase 3 — Subscription Engine configurable BO
    # ------------------------------------------------------------
    code = models.SlugField(
        max_length=64, unique=True, blank=True, db_index=True,
        help_text=_("Identifiant stable (ex: pro-monthly). Auto-généré sinon."),
    )
    is_public = models.BooleanField(_("visible sur /pricing"), default=True)
    is_highlight = models.BooleanField(_("plan mis en avant"), default=False)
    sort_order = models.PositiveIntegerField(default=100, db_index=True)
    trial_days = models.PositiveIntegerField(_("jours d'essai gratuit"), default=0)
    tagline = models.CharField(_("accroche"), max_length=200, blank=True, default="")
    cta_label = models.CharField(_("texte du bouton"), max_length=80, blank=True, default="")
    target_role = models.CharField(
        _("cible"), max_length=24, choices=TargetRole.choices, default=TargetRole.ANY,
        db_index=True,
    )
    quotas = models.JSONField(
        _("quotas additionnels"), default=dict, blank=True,
        help_text=_("Quotas libres au format JSON (ex: {api_requests_day: 1000})."),
    )

    class Meta(BaseModel.Meta):
        ordering = ("sort_order", "monthly_price")

    def __str__(self) -> str:
        return f"{self.name} ({self.tier})"

    def save(self, *args, **kwargs):
        if not self.code:
            from django.utils.text import slugify
            self.code = slugify(f"{self.tier}-{self.name}")[:64]
        super().save(*args, **kwargs)


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
