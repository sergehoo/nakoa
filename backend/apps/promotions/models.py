"""Modèles du Promotion Engine.

Architecture :
  PromotionCampaign  (1) ─── (N) CouponCode  (1) ─── (N) CouponRedemption

- Une campagne définit le type de discount et les conditions générales.
- Un coupon est un code utilisable (1 campagne peut avoir 1 code unique ou
  N codes générés en bulk).
- Une rédemption trace une utilisation effective sur une commande.
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, UUIDPKModel, TimeStampedModel


# ============================================================
# Campagne — un type de discount + conditions globales
# ============================================================
class PromotionCampaign(BaseModel):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", _("Pourcentage")
        FIXED = "fixed", _("Montant fixe")
        FREE_SHIPPING = "free_shipping", _("Livraison gratuite")
        CREDIT = "credit", _("Crédit / cashback")

    class Status(models.TextChoices):
        DRAFT = "draft", _("Brouillon")
        ACTIVE = "active", _("Active")
        PAUSED = "paused", _("En pause")
        ENDED = "ended", _("Terminée")

    name = models.CharField(_("nom"), max_length=200)
    slug = models.SlugField(max_length=80, unique=True)
    description = models.TextField(_("description"), blank=True, default="")
    status = models.CharField(
        _("statut"), max_length=12, choices=Status.choices, default=Status.DRAFT, db_index=True,
    )

    # Type et montant
    discount_type = models.CharField(
        _("type de remise"), max_length=20, choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE,
    )
    discount_value = models.DecimalField(
        _("valeur"), max_digits=15, decimal_places=4, default=Decimal("0"),
        help_text=_("% pour pourcentage (0.10 = 10%), montant pour fixe/crédit."),
    )
    currency = models.CharField(max_length=8, default="XOF")
    max_discount_amount = models.DecimalField(
        _("plafond de remise"), max_digits=15, decimal_places=2, null=True, blank=True,
        help_text=_("Ne s'applique que pour le type pourcentage."),
    )
    min_order_amount = models.DecimalField(
        _("commande minimum"), max_digits=15, decimal_places=2, default=Decimal("0"),
    )

    # Validité
    starts_at = models.DateTimeField(_("démarre le"), default=timezone.now)
    ends_at = models.DateTimeField(_("se termine le"), null=True, blank=True)

    # Quotas globaux
    total_usage_limit = models.PositiveIntegerField(
        _("limite globale d'utilisation"), null=True, blank=True,
        help_text=_("Toutes utilisations confondues. Vide = illimité."),
    )
    usage_count = models.PositiveIntegerField(default=0, editable=False)

    # Quota par utilisateur
    per_user_limit = models.PositiveIntegerField(
        _("utilisations max par client"), default=1,
    )

    # Conditions DSL — réutilise rule_engine du Revenue Engine
    conditions = models.JSONField(
        _("conditions (DSL JSON)"), default=dict, blank=True,
        help_text=_(
            "DSL : {all:[…]} / {any:[…]} / {not:…} / {fact, op, value}. "
            "Contexte = {order, customer, printer}."
        ),
    )

    # Ciblage
    is_public = models.BooleanField(
        _("publique (sans code)"), default=False,
        help_text=_("Si True, s'applique automatiquement à toute commande éligible."),
    )

    class Meta:
        ordering = ("-starts_at", "name")
        verbose_name = _("Campagne promotionnelle")
        verbose_name_plural = _("Campagnes promotionnelles")
        indexes = [
            models.Index(fields=["status", "starts_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_status_display()})"

    def is_currently_running(self) -> bool:
        now = timezone.now()
        if self.status != self.Status.ACTIVE:
            return False
        if self.starts_at and now < self.starts_at:
            return False
        if self.ends_at and now > self.ends_at:
            return False
        if self.total_usage_limit and self.usage_count >= self.total_usage_limit:
            return False
        return True


# ============================================================
# Code coupon — un identifiant utilisable
# ============================================================
class CouponCode(UUIDPKModel, TimeStampedModel):
    """Un code (string) lié à une campagne, utilisable par un client."""

    campaign = models.ForeignKey(
        PromotionCampaign, on_delete=models.CASCADE, related_name="codes",
    )
    code = models.CharField(
        _("code"), max_length=64, unique=True, db_index=True,
        help_text=_("Identifiant saisi par le client (NAKOA20, BIENVENUE2026…)."),
    )

    # Quota propre au code (peut être plus restrictif que la campagne)
    max_redemptions = models.PositiveIntegerField(
        _("max redemptions"), null=True, blank=True,
    )
    redemption_count = models.PositiveIntegerField(default=0, editable=False)

    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Si le code est lié à un utilisateur précis (parrainage par exemple)
    restricted_to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="+",
    )

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Code coupon")
        verbose_name_plural = _("Codes coupons")

    def __str__(self) -> str:
        return self.code

    def save(self, *args, **kwargs):
        # Normalise les codes en majuscules sans espaces
        if self.code:
            self.code = self.code.upper().strip().replace(" ", "")
        super().save(*args, **kwargs)

    def is_usable(self) -> bool:
        if not self.is_active:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        if self.max_redemptions and self.redemption_count >= self.max_redemptions:
            return False
        return True


# ============================================================
# Rédemption — trace d'utilisation
# ============================================================
class CouponRedemption(UUIDPKModel, TimeStampedModel):
    """Une utilisation effective d'un coupon sur une commande."""

    class Status(models.TextChoices):
        PENDING = "pending", _("En attente")
        APPLIED = "applied", _("Appliquée")
        REVERSED = "reversed", _("Annulée")

    code = models.ForeignKey(
        CouponCode, on_delete=models.PROTECT, related_name="redemptions",
    )
    campaign = models.ForeignKey(
        PromotionCampaign, on_delete=models.PROTECT, related_name="redemptions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="coupon_redemptions",
    )
    order_id = models.UUIDField(null=True, blank=True, db_index=True)

    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    currency = models.CharField(max_length=8, default="XOF")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.APPLIED, db_index=True,
    )
    reversal_reason = models.CharField(max_length=200, blank=True, default="")

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Utilisation de coupon")
        verbose_name_plural = _("Utilisations de coupons")
        indexes = [
            models.Index(fields=["user", "code"]),
        ]
