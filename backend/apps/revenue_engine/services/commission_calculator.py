"""Calcul de commission sur une commande.

Orchestration :
1. On vérifie que la source de revenu "commission" est activée.
2. On charge toutes les CommissionRule actives, triées par priorité.
3. Pour chaque règle, on évalue le DSL contre le contexte de la commande.
   - Si la règle matche : on calcule sa contribution (% / fixe / combiné),
     on applique les bornes min/max, on log l'évaluation.
   - Selon `stacking` : on s'arrête à la 1ère règle matchée, ou on cumule.
4. On applique les bornes globales (MonetizationConfig).
5. On enregistre une RevenueEntry de type "commission" pour le dashboard.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from django.db import transaction
from django.utils import timezone

from ..models import (
    CommissionRule,
    MonetizationConfig,
    RevenueEntry,
    RevenueSource,
    RuleEvaluationLog,
)
from .rule_engine import RuleEngineError, evaluate_rule

logger = logging.getLogger(__name__)


# ============================================================
# Résultat
# ============================================================
@dataclass
class CommissionResult:
    """Résultat structuré du calcul de commission sur une commande."""

    amount: Decimal = Decimal("0")
    currency: str = "XOF"
    applied_rules: list[dict[str, Any]] = field(default_factory=list)
    base_amount: Decimal = Decimal("0")
    skipped_reason: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "amount": str(self.amount),
            "currency": self.currency,
            "applied_rules": self.applied_rules,
            "base_amount": str(self.base_amount),
            "skipped_reason": self.skipped_reason,
        }


# ============================================================
# Calculateur
# ============================================================
class CommissionCalculator:
    """Calcule la commission marketplace sur une commande."""

    def __init__(self, *, dry_run: bool = False):
        self.dry_run = dry_run

    # ----- Public ----------------------------------------------
    def compute(self, order) -> CommissionResult:
        """Calcule la commission pour une commande Django ORM `Order`.

        - Si `dry_run=True`, n'écrit rien (utile pour un endpoint "prévisualiser").
        - Sinon, écrit RuleEvaluationLog + RevenueEntry.
        """
        config = MonetizationConfig.get_solo()

        # Kill switch global
        if config.commissions_kill_switch:
            return CommissionResult(
                currency=self._currency_of(order),
                base_amount=self._base_of(order),
                skipped_reason="kill_switch",
            )

        # Source désactivée ?
        source = (
            RevenueSource.objects.filter(
                kind=RevenueSource.Kind.COMMISSION, is_enabled=True
            )
            .order_by("sort_order")
            .first()
        )
        if not source:
            return CommissionResult(
                currency=self._currency_of(order),
                base_amount=self._base_of(order),
                skipped_reason="source_disabled",
            )

        context = self._build_context(order)
        base = self._base_of(order)
        currency = self._currency_of(order)

        result = CommissionResult(base_amount=base, currency=currency)
        rules_qs = (
            CommissionRule.objects.filter(is_active=True)
            .select_related("source")
            .order_by("priority", "name")
        )

        for rule in rules_qs:
            if not rule.is_currently_active():
                continue
            try:
                matched = evaluate_rule(rule.conditions or {}, context)
            except RuleEngineError as exc:
                logger.warning("Règle invalide id=%s : %s", rule.id, exc)
                matched = False

            if not matched:
                if not self.dry_run and config.log_evaluations:
                    self._log_eval(order, rule, matched=False, amount=Decimal("0"), context=context)
                continue

            amount = self._compute_rule_amount(rule, base)
            amount = self._clamp(amount, rule.min_commission, rule.max_commission)
            result.amount += amount
            result.applied_rules.append(
                {
                    "id": str(rule.id),
                    "name": rule.name,
                    "amount": str(amount),
                    "calculation_type": rule.calculation_type,
                    "stacking": rule.stacking,
                }
            )

            if not self.dry_run:
                self._log_eval(order, rule, matched=True, amount=amount, context=context)

            if rule.stacking == CommissionRule.Stacking.STOP_ON_MATCH:
                break

        # Bornes globales (MonetizationConfig)
        if result.amount == 0 and not result.applied_rules:
            # Pas de règle matchée — applique le défaut config
            default = (base * config.default_commission_rate).quantize(Decimal("0.01"))
            result.amount = default
            result.applied_rules.append(
                {"id": None, "name": "Default (config)", "amount": str(default)}
            )

        result.amount = self._clamp(
            result.amount, config.default_commission_min, config.default_commission_max
        )

        if not self.dry_run:
            self._record_revenue(order, source, result)

        return result

    # ----- Internals -------------------------------------------
    def _build_context(self, order) -> dict[str, Any]:
        """Construit le contexte passé au DSL."""
        printer = getattr(order, "printer", None)
        customer = getattr(order, "customer", None)
        return {
            "order": {
                "id": str(order.id),
                "reference": getattr(order, "reference", ""),
                "total": self._dec(getattr(order, "total_incl_tax", 0)),
                "total_excl_tax": self._dec(getattr(order, "total_excl_tax", 0)),
                "currency": getattr(order, "currency", "XOF"),
                "country": getattr(order, "country", "") or "",
                "status": getattr(order, "status", "") or "",
            },
            "printer": {
                "id": str(printer.id) if printer else None,
                "country": getattr(printer, "country", "") or "" if printer else "",
                "city": getattr(printer, "city", "") or "" if printer else "",
                "is_premium": bool(getattr(printer, "is_premium", False)) if printer else False,
                "kyc_level": getattr(printer, "kyc_level", "") or "" if printer else "",
            },
            "customer": {
                "id": str(customer.id) if customer else None,
                "country": getattr(customer, "country", "") or "" if customer else "",
                "primary_role": getattr(customer, "primary_role", "") or "" if customer else "",
            },
        }

    @staticmethod
    def _base_of(order) -> Decimal:
        """Montant sur lequel s'applique le %. Par défaut le HT."""
        v = getattr(order, "total_excl_tax", None)
        if v is None:
            v = getattr(order, "total_incl_tax", 0)
        return CommissionCalculator._dec(v)

    @staticmethod
    def _currency_of(order) -> str:
        return getattr(order, "currency", None) or "XOF"

    @staticmethod
    def _dec(v) -> Decimal:
        if v is None:
            return Decimal("0")
        if isinstance(v, Decimal):
            return v
        try:
            return Decimal(str(v))
        except Exception:  # noqa: BLE001
            return Decimal("0")

    @staticmethod
    def _compute_rule_amount(rule: CommissionRule, base: Decimal) -> Decimal:
        if rule.calculation_type == CommissionRule.CalculationType.PERCENTAGE:
            return (base * rule.percentage).quantize(Decimal("0.01"))
        if rule.calculation_type == CommissionRule.CalculationType.FIXED:
            return rule.fixed_amount.quantize(Decimal("0.01"))
        # COMBINED
        return (rule.fixed_amount + base * rule.percentage).quantize(Decimal("0.01"))

    @staticmethod
    def _clamp(value: Decimal, lo: Decimal | None, hi: Decimal | None) -> Decimal:
        if lo is not None and value < lo:
            value = lo
        if hi is not None and value > hi:
            value = hi
        return value

    @transaction.atomic
    def _record_revenue(self, order, source: RevenueSource, result: CommissionResult) -> None:
        if result.amount <= 0:
            return
        RevenueEntry.objects.create(
            source=source,
            amount=result.amount,
            currency=result.currency,
            occurred_at=timezone.now(),
            order_id=order.id,
            printer_id=getattr(order.printer, "id", None) if getattr(order, "printer", None) else None,
            customer_id=getattr(order.customer, "id", None) if getattr(order, "customer", None) else None,
            country=getattr(order, "country", "") or "",
            metadata={"applied_rules": result.applied_rules, "base_amount": str(result.base_amount)},
        )

    def _log_eval(self, order, rule: CommissionRule, *, matched: bool, amount: Decimal, context: dict) -> None:
        try:
            RuleEvaluationLog.objects.create(
                order_id=order.id,
                rule=rule,
                matched=matched,
                computed_amount=amount,
                context_snapshot=context,
                details={"calculation_type": rule.calculation_type},
            )
        except Exception:  # noqa: BLE001
            logger.exception("RuleEvaluationLog : échec d'écriture (order=%s)", order.id)
