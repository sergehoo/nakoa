"""Service de validation et d'application des coupons."""

from __future__ import annotations

import logging
import secrets
import string
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.db.models import F

from .models import CouponCode, CouponRedemption, PromotionCampaign

logger = logging.getLogger(__name__)


class CouponError(ValueError):
    """Erreur métier d'un coupon (expiré, plafond, conditions non remplies…)."""


@dataclass
class CouponValidation:
    """Résultat de la validation d'un code."""

    ok: bool
    code: CouponCode | None = None
    campaign: PromotionCampaign | None = None
    discount_amount: Decimal = Decimal("0")
    discount_type: str = "percentage"
    currency: str = "XOF"
    reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "ok": self.ok,
            "reason": self.reason,
            "discount_amount": str(self.discount_amount),
            "discount_type": self.discount_type,
            "currency": self.currency,
            "code": self.code.code if self.code else None,
            "campaign_name": self.campaign.name if self.campaign else None,
        }


# ============================================================
# Helpers privés
# ============================================================
def _evaluate_conditions(rule: Any, context: dict) -> bool:
    """Évalue les conditions DSL en réutilisant le rule_engine du Revenue Engine."""
    try:
        from apps.revenue_engine.services.rule_engine import evaluate_rule
    except ImportError:
        # Si le revenue_engine n'est pas dispo, on considère qu'il n'y a pas de conditions
        return True
    try:
        return evaluate_rule(rule or {}, context or {})
    except Exception:  # noqa: BLE001
        logger.exception("DSL coupon invalide : %r", rule)
        return False


def _compute_discount(campaign: PromotionCampaign, base_amount: Decimal) -> Decimal:
    """Calcule le montant de remise en fonction du type."""
    if campaign.discount_type == PromotionCampaign.DiscountType.PERCENTAGE:
        amount = (base_amount * campaign.discount_value).quantize(Decimal("0.01"))
    elif campaign.discount_type in (
        PromotionCampaign.DiscountType.FIXED,
        PromotionCampaign.DiscountType.CREDIT,
    ):
        amount = campaign.discount_value.quantize(Decimal("0.01"))
    elif campaign.discount_type == PromotionCampaign.DiscountType.FREE_SHIPPING:
        # La somme exacte sera fixée par l'appelant (montant du shipping).
        amount = campaign.discount_value.quantize(Decimal("0.01"))
    else:
        amount = Decimal("0")

    # Plafond
    if campaign.max_discount_amount and amount > campaign.max_discount_amount:
        amount = campaign.max_discount_amount
    # Sécurité : pas de remise négative ni au-delà du base
    if amount < 0:
        amount = Decimal("0")
    if amount > base_amount and campaign.discount_type != PromotionCampaign.DiscountType.FREE_SHIPPING:
        amount = base_amount
    return amount


# ============================================================
# Service principal
# ============================================================
class CouponValidator:
    """Valide et applique un code promo sur une commande/contexte."""

    def validate(
        self, *, code: str, user, order_total: Decimal, context: dict | None = None,
    ) -> CouponValidation:
        """Valide un code et retourne le montant de remise sans rien persister."""
        ctx = context or {}
        ctx.setdefault("order", {})
        ctx["order"]["total"] = order_total

        normalized = (code or "").upper().strip().replace(" ", "")
        if not normalized:
            return CouponValidation(ok=False, reason="empty_code")

        try:
            coupon = CouponCode.objects.select_related("campaign").get(code=normalized)
        except CouponCode.DoesNotExist:
            return CouponValidation(ok=False, reason="code_unknown")

        if not coupon.is_usable():
            return CouponValidation(
                ok=False, code=coupon, campaign=coupon.campaign,
                reason="code_unusable",
            )

        campaign = coupon.campaign
        if not campaign.is_currently_running():
            return CouponValidation(
                ok=False, code=coupon, campaign=campaign,
                reason="campaign_inactive",
            )

        # Restriction à un user précis ?
        if coupon.restricted_to_user_id and coupon.restricted_to_user_id != user.id:
            return CouponValidation(
                ok=False, code=coupon, campaign=campaign,
                reason="restricted_to_other_user",
            )

        # Minimum d'achat
        if order_total < campaign.min_order_amount:
            return CouponValidation(
                ok=False, code=coupon, campaign=campaign,
                reason="below_min_order",
            )

        # Quota par utilisateur
        used_by_user = CouponRedemption.objects.filter(
            code=coupon, user=user, status=CouponRedemption.Status.APPLIED,
        ).count()
        if used_by_user >= campaign.per_user_limit:
            return CouponValidation(
                ok=False, code=coupon, campaign=campaign,
                reason="per_user_limit_reached",
            )

        # Conditions DSL
        if not _evaluate_conditions(campaign.conditions, ctx):
            return CouponValidation(
                ok=False, code=coupon, campaign=campaign,
                reason="conditions_not_met",
            )

        # Calcule la remise
        amount = _compute_discount(campaign, order_total)
        return CouponValidation(
            ok=True, code=coupon, campaign=campaign,
            discount_amount=amount,
            discount_type=campaign.discount_type,
            currency=campaign.currency,
        )

    @transaction.atomic
    def apply(
        self, *, code: str, user, order_total: Decimal, order_id: str | None = None,
        context: dict | None = None,
    ) -> CouponValidation:
        """Valide ET persiste une CouponRedemption + incrémente les compteurs."""
        result = self.validate(code=code, user=user, order_total=order_total, context=context)
        if not result.ok or not result.code:
            return result

        CouponRedemption.objects.create(
            code=result.code,
            campaign=result.campaign,
            user=user,
            order_id=order_id,
            discount_amount=result.discount_amount,
            currency=result.currency,
            status=CouponRedemption.Status.APPLIED,
        )
        # Compteurs atomiques (évite races)
        CouponCode.objects.filter(pk=result.code.pk).update(
            redemption_count=F("redemption_count") + 1
        )
        PromotionCampaign.objects.filter(pk=result.campaign.pk).update(
            usage_count=F("usage_count") + 1
        )
        return result

    @transaction.atomic
    def reverse(self, redemption: CouponRedemption, *, reason: str = "") -> CouponRedemption:
        """Annule une rédemption (commande annulée). Libère le quota."""
        if redemption.status == CouponRedemption.Status.REVERSED:
            return redemption
        redemption.status = CouponRedemption.Status.REVERSED
        redemption.reversal_reason = reason or ""
        redemption.save(update_fields=["status", "reversal_reason", "updated_at"])

        CouponCode.objects.filter(pk=redemption.code_id, redemption_count__gt=0).update(
            redemption_count=F("redemption_count") - 1
        )
        PromotionCampaign.objects.filter(pk=redemption.campaign_id, usage_count__gt=0).update(
            usage_count=F("usage_count") - 1
        )
        return redemption


# ============================================================
# Génération en bulk de codes
# ============================================================
def generate_codes(
    campaign: PromotionCampaign, *, count: int, prefix: str = "", length: int = 8,
) -> list[CouponCode]:
    """Crée `count` codes uniques aléatoires liés à `campaign`."""
    alphabet = string.ascii_uppercase + string.digits
    created: list[CouponCode] = []
    seen: set[str] = set()
    while len(created) < count:
        suffix = "".join(secrets.choice(alphabet) for _ in range(length))
        code = f"{prefix}{suffix}"[:64].upper()
        if code in seen or CouponCode.objects.filter(code=code).exists():
            continue
        seen.add(code)
        created.append(CouponCode.objects.create(campaign=campaign, code=code))
    return created
