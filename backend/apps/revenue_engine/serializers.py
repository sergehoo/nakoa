"""Sérialiseurs du Revenue Engine."""

from __future__ import annotations

from rest_framework import serializers

from .models import (
    CommissionRule,
    MonetizationConfig,
    RevenueEntry,
    RevenueSource,
    RuleAuditLog,
    RuleEvaluationLog,
    RuleVersion,
)
from .services.rule_engine import RuleEngineError, evaluate_rule


# ============================================================
# RevenueSource
# ============================================================
class RevenueSourceSerializer(serializers.ModelSerializer):
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = RevenueSource
        fields = [
            "id", "code", "kind", "kind_label", "label", "description",
            "is_enabled", "icon", "sort_order", "config",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "kind_label")


# ============================================================
# MonetizationConfig
# ============================================================
class MonetizationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonetizationConfig
        fields = [
            "id", "default_currency", "default_vat_rate",
            "default_commission_rate", "default_commission_min", "default_commission_max",
            "log_evaluations", "commissions_kill_switch",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")


# ============================================================
# CommissionRule
# ============================================================
class CommissionRuleSerializer(serializers.ModelSerializer):
    source_label = serializers.CharField(source="source.label", read_only=True)
    calculation_type_label = serializers.CharField(
        source="get_calculation_type_display", read_only=True
    )

    class Meta:
        model = CommissionRule
        fields = [
            "id", "source", "source_label",
            "name", "description", "is_active",
            "conditions",
            "calculation_type", "calculation_type_label",
            "percentage", "fixed_amount",
            "min_commission", "max_commission",
            "priority", "stacking",
            "active_from", "active_until",
            "applies_to_country", "applies_to_currency",
            "created_at", "updated_at",
        ]
        read_only_fields = (
            "id", "created_at", "updated_at", "source_label", "calculation_type_label"
        )

    def validate_conditions(self, value):
        """Valide que le DSL est bien formé en l'évaluant contre un contexte neutre."""
        if value in (None, {}):
            return value or {}
        try:
            evaluate_rule(value, context={})
        except RuleEngineError as exc:
            raise serializers.ValidationError(f"DSL invalide : {exc}") from exc
        return value


# ============================================================
# RuleVersion
# ============================================================
class RuleVersionSerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source="changed_by.email", read_only=True)

    class Meta:
        model = RuleVersion
        fields = [
            "id", "rule", "version_number", "snapshot",
            "changed_by", "changed_by_email", "reason",
            "created_at",
        ]
        read_only_fields = fields


# ============================================================
# RuleAuditLog
# ============================================================
class RuleAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source="actor.email", read_only=True)

    class Meta:
        model = RuleAuditLog
        fields = [
            "id", "actor", "actor_email", "action",
            "target_type", "target_id", "target_label",
            "before", "after", "reason",
            "created_at",
        ]
        read_only_fields = fields


# ============================================================
# RuleEvaluationLog
# ============================================================
class RuleEvaluationLogSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source="rule.name", read_only=True)

    class Meta:
        model = RuleEvaluationLog
        fields = [
            "id", "order_id", "rule", "rule_name",
            "matched", "computed_amount",
            "context_snapshot", "details",
            "created_at",
        ]
        read_only_fields = fields


# ============================================================
# RevenueEntry
# ============================================================
class RevenueEntrySerializer(serializers.ModelSerializer):
    source_label = serializers.CharField(source="source.label", read_only=True)
    source_kind = serializers.CharField(source="source.kind", read_only=True)

    class Meta:
        model = RevenueEntry
        fields = [
            "id", "source", "source_label", "source_kind",
            "amount", "currency", "occurred_at",
            "order_id", "printer_id", "customer_id",
            "country", "category", "metadata",
            "created_at",
        ]
        read_only_fields = ("id", "created_at", "source_label", "source_kind")
