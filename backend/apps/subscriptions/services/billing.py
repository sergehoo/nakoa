"""Service de billing des abonnements.

Responsabilités :
- créer/renouveler/annuler une souscription
- gérer l'essai gratuit
- enregistrer une RevenueEntry (source=subscription) à chaque encaissement
- exposer des helpers pour les quotas (max_products, max_orders, ai_messages…)

Intégration paiement : on délègue à `apps.payments.services` (Paystack par défaut)
quand un encaissement est requis. Pour les plans à 0 (FREE), pas de paiement.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from ..models import Plan, Subscription

logger = logging.getLogger(__name__)


class SubscriptionError(Exception):
    """Erreur métier d'abonnement (plan inactif, cycle inconnu, etc.)."""


# ============================================================
# Helpers publics
# ============================================================
def get_active_subscription(user) -> Subscription | None:
    """Retourne l'abonnement actif (ou en essai) d'un utilisateur."""
    return (
        Subscription.objects.filter(
            subscriber=user,
            status__in=(Subscription.Status.ACTIVE, Subscription.Status.TRIAL),
        )
        .select_related("plan")
        .order_by("-current_period_end")
        .first()
    )


def user_has_feature(user, feature_code: str) -> bool:
    """`True` si le plan en cours de l'utilisateur inclut `feature_code` dans `features`.

    Utilisable depuis une view pour gating :
        if not user_has_feature(request.user, "api_access"):
            return Response({"detail": "Plan insuffisant."}, status=402)
    """
    sub = get_active_subscription(user)
    if not sub:
        return False
    features = sub.plan.features or []
    return feature_code in features


def user_quota(user, quota_key: str, default: int = 0) -> int:
    """Lit un quota du plan en cours (ex: api_requests_day)."""
    sub = get_active_subscription(user)
    if not sub:
        return default
    quotas = sub.plan.quotas or {}
    try:
        return int(quotas.get(quota_key, default))
    except (TypeError, ValueError):
        return default


# ============================================================
# Résultat d'une opération de billing
# ============================================================
@dataclass
class BillingResult:
    subscription: Subscription
    amount: Decimal
    currency: str
    payment_required: bool
    payment_reference: str | None = None


# ============================================================
# Service principal
# ============================================================
class SubscriptionBillingService:
    """Orchestrateur des opérations d'abonnement."""

    # ----- Souscription initiale --------------------------------
    @transaction.atomic
    def subscribe(
        self,
        *,
        user,
        plan: Plan,
        cycle: str = Subscription.BillingCycle.MONTHLY,
        provider_reference: str = "",
        start_trial: bool = True,
    ) -> BillingResult:
        if not plan.is_active:
            raise SubscriptionError("Ce plan n'est plus actif.")
        if cycle not in dict(Subscription.BillingCycle.choices):
            raise SubscriptionError(f"Cycle inconnu : {cycle}")

        # Annule l'éventuel abonnement actif courant (downgrade/upgrade)
        existing = get_active_subscription(user)
        if existing:
            existing.status = Subscription.Status.CANCELLED
            existing.cancelled_at = timezone.now()
            existing.cancellation_reason = "remplacé par un nouvel abonnement"
            existing.save(update_fields=["status", "cancelled_at", "cancellation_reason", "updated_at"])

        now = timezone.now()
        period_days = 30 if cycle == Subscription.BillingCycle.MONTHLY else 365

        # Essai gratuit ?
        is_trial = start_trial and plan.trial_days > 0
        if is_trial:
            status = Subscription.Status.TRIAL
            trial_end = now + timedelta(days=plan.trial_days)
            period_end = trial_end
            payment_required = False
        else:
            status = Subscription.Status.ACTIVE
            trial_end = None
            period_end = now + timedelta(days=period_days)
            payment_required = self._price_for(plan, cycle) > 0

        sub = Subscription.objects.create(
            subscriber=user,
            plan=plan,
            cycle=cycle,
            status=status,
            started_at=now,
            current_period_end=period_end,
            trial_ends_at=trial_end,
            provider_reference=provider_reference,
            auto_renew=True,
        )

        # Si pas en essai et plan payant : enregistre l'encaissement comme RevenueEntry
        if not is_trial and payment_required:
            self._record_revenue(sub)

        return BillingResult(
            subscription=sub,
            amount=self._price_for(plan, cycle),
            currency=plan.currency,
            payment_required=payment_required,
            payment_reference=provider_reference or None,
        )

    # ----- Renouvellement ---------------------------------------
    @transaction.atomic
    def renew(self, subscription: Subscription, *, payment_reference: str = "") -> BillingResult:
        if subscription.status == Subscription.Status.CANCELLED:
            raise SubscriptionError("Abonnement annulé.")

        period_days = (
            30 if subscription.cycle == Subscription.BillingCycle.MONTHLY else 365
        )
        subscription.status = Subscription.Status.ACTIVE
        subscription.current_period_end = (
            max(subscription.current_period_end, timezone.now()) + timedelta(days=period_days)
        )
        if payment_reference:
            subscription.provider_reference = payment_reference
        subscription.save(update_fields=[
            "status", "current_period_end", "provider_reference", "updated_at",
        ])

        # Revenue tracking
        self._record_revenue(subscription)

        return BillingResult(
            subscription=subscription,
            amount=self._price_for(subscription.plan, subscription.cycle),
            currency=subscription.plan.currency,
            payment_required=False,
            payment_reference=payment_reference or None,
        )

    # ----- Annulation -------------------------------------------
    @transaction.atomic
    def cancel(self, subscription: Subscription, *, reason: str = "") -> Subscription:
        if subscription.status == Subscription.Status.CANCELLED:
            return subscription
        subscription.status = Subscription.Status.CANCELLED
        subscription.auto_renew = False
        subscription.cancelled_at = timezone.now()
        subscription.cancellation_reason = reason or ""
        subscription.save(update_fields=[
            "status", "auto_renew", "cancelled_at", "cancellation_reason", "updated_at",
        ])
        return subscription

    # ----- Pricing helpers --------------------------------------
    @staticmethod
    def _price_for(plan: Plan, cycle: str) -> Decimal:
        return plan.yearly_price if cycle == Subscription.BillingCycle.YEARLY else plan.monthly_price

    # ----- Revenue Engine integration ---------------------------
    def _record_revenue(self, subscription: Subscription) -> None:
        """Écrit une RevenueEntry de type subscription dans le Revenue Engine."""
        amount = self._price_for(subscription.plan, subscription.cycle)
        if amount <= 0:
            return
        try:
            from apps.revenue_engine.models import RevenueEntry, RevenueSource

            source = (
                RevenueSource.objects.filter(
                    kind=RevenueSource.Kind.SUBSCRIPTION, is_enabled=True
                )
                .order_by("sort_order")
                .first()
            )
            if not source:
                logger.debug("Pas de RevenueSource subscription active — entrée ignorée.")
                return
            RevenueEntry.objects.create(
                source=source,
                amount=amount,
                currency=subscription.plan.currency,
                occurred_at=timezone.now(),
                customer_id=getattr(subscription.subscriber, "id", None),
                country=getattr(subscription.subscriber, "country", "") or "",
                metadata={
                    "plan_code": subscription.plan.code,
                    "plan_tier": subscription.plan.tier,
                    "cycle": subscription.cycle,
                    "subscription_id": str(subscription.id),
                },
            )
        except Exception:  # noqa: BLE001
            logger.exception("Échec enregistrement RevenueEntry pour subscription=%s", subscription.id)

    # ----- Maintenance batch ------------------------------------
    @classmethod
    def sweep_expired(cls) -> dict[str, int]:
        """Tâche périodique : marque les abonnements échus.

        À brancher dans Celery beat (toutes les heures par exemple).
        """
        now = timezone.now()
        # Essais expirés → past_due
        n_trial = Subscription.objects.filter(
            status=Subscription.Status.TRIAL,
            current_period_end__lt=now,
        ).update(status=Subscription.Status.PAST_DUE)
        # Active sans renouvellement → past_due
        n_active = Subscription.objects.filter(
            status=Subscription.Status.ACTIVE,
            current_period_end__lt=now,
            auto_renew=False,
        ).update(status=Subscription.Status.EXPIRED)
        return {"trial_expired": n_trial, "active_expired": n_active}
