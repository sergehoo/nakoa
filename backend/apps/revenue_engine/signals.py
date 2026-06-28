"""Signaux du Revenue Engine.

- post_save sur CommissionRule → crée un snapshot RuleVersion (versioning).
- post_save sur Order (lorsque status passe à "completed") → calcule la
  commission via CommissionCalculator. On évite de modifier apps/orders pour
  garder une dépendance unidirectionnelle (revenue_engine dépend d'orders,
  pas l'inverse).
"""

from __future__ import annotations

import logging

from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import CommissionRule, RuleVersion

logger = logging.getLogger(__name__)


# ============================================================
# Versioning automatique des règles
# ============================================================
@receiver(post_save, sender=CommissionRule)
def snapshot_rule_on_save(sender, instance: CommissionRule, created, **kwargs):
    """Crée une RuleVersion à chaque save d'une règle de commission."""
    try:
        last = (
            RuleVersion.objects.filter(rule=instance)
            .order_by("-version_number")
            .first()
        )
        next_number = (last.version_number + 1) if last else 1
        RuleVersion.objects.create(
            rule=instance,
            version_number=next_number,
            snapshot={
                "name": instance.name,
                "description": instance.description,
                "is_active": instance.is_active,
                "conditions": instance.conditions,
                "calculation_type": instance.calculation_type,
                "percentage": str(instance.percentage),
                "fixed_amount": str(instance.fixed_amount),
                "min_commission": str(instance.min_commission),
                "max_commission": (
                    str(instance.max_commission) if instance.max_commission is not None else None
                ),
                "priority": instance.priority,
                "stacking": instance.stacking,
                "active_from": instance.active_from.isoformat() if instance.active_from else None,
                "active_until": instance.active_until.isoformat() if instance.active_until else None,
            },
        )
    except Exception:  # noqa: BLE001
        logger.exception("Échec snapshot RuleVersion pour règle %s", instance.id)


# ============================================================
# Calcul de commission à la complétion d'une commande
# ============================================================
@receiver(pre_save, sender="orders.Order")
def remember_previous_status(sender, instance, **kwargs):
    """Mémorise le status précédent pour détecter la transition vers completed."""
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        previous = sender.objects.only("status").get(pk=instance.pk)
        instance._previous_status = previous.status
    except sender.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender="orders.Order")
def compute_commission_on_completion(sender, instance, created, **kwargs):
    """Déclenche le calcul de commission quand l'ordre passe à `completed`."""
    new_status = getattr(instance, "status", None)
    previous = getattr(instance, "_previous_status", None)

    # On se déclenche à la transition vers completed (ou delivered selon le métier).
    target_statuses = {"completed", "delivered"}
    if new_status not in target_statuses:
        return
    if previous in target_statuses:
        return  # déjà traité

    def _run():
        from .services import CommissionCalculator
        try:
            CommissionCalculator().compute(instance)
        except Exception:  # noqa: BLE001
            logger.exception("Échec calcul commission pour order=%s", instance.id)

    transaction.on_commit(_run)
