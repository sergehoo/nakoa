"""Configuration de l'admin Django pour le Revenue Engine.

Permet au Super Admin d'accéder rapidement à la configuration via l'admin
Django standard, en complément du BO custom Next.js.
"""

from __future__ import annotations

from django.contrib import admin

from .models import (
    CommissionRule,
    MonetizationConfig,
    RevenueEntry,
    RevenueSource,
    RuleAuditLog,
    RuleEvaluationLog,
    RuleVersion,
)


@admin.register(RevenueSource)
class RevenueSourceAdmin(admin.ModelAdmin):
    list_display = ("code", "kind", "label", "is_enabled", "sort_order")
    list_filter = ("kind", "is_enabled")
    list_editable = ("is_enabled", "sort_order")
    search_fields = ("code", "label")


@admin.register(MonetizationConfig)
class MonetizationConfigAdmin(admin.ModelAdmin):
    list_display = ("default_currency", "default_commission_rate", "commissions_kill_switch")
    readonly_fields = ("created_at", "updated_at")


@admin.register(CommissionRule)
class CommissionRuleAdmin(admin.ModelAdmin):
    list_display = ("name", "source", "calculation_type", "percentage",
                    "fixed_amount", "priority", "is_active")
    list_filter = ("source", "calculation_type", "is_active", "stacking")
    search_fields = ("name", "description")
    list_editable = ("priority", "is_active")


@admin.register(RuleVersion)
class RuleVersionAdmin(admin.ModelAdmin):
    list_display = ("rule", "version_number", "changed_by", "created_at")
    list_filter = ("rule",)
    readonly_fields = ("rule", "version_number", "snapshot", "changed_by", "reason", "created_at")


@admin.register(RuleAuditLog)
class RuleAuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "target_type", "target_label")
    list_filter = ("action", "target_type")
    search_fields = ("target_label", "reason")
    readonly_fields = tuple(f.name for f in RuleAuditLog._meta.fields)


@admin.register(RuleEvaluationLog)
class RuleEvaluationLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "order_id", "rule", "matched", "computed_amount")
    list_filter = ("matched",)
    search_fields = ("order_id",)
    readonly_fields = tuple(f.name for f in RuleEvaluationLog._meta.fields)


@admin.register(RevenueEntry)
class RevenueEntryAdmin(admin.ModelAdmin):
    list_display = ("occurred_at", "source", "amount", "currency", "country", "order_id")
    list_filter = ("source__kind", "currency", "country")
    date_hierarchy = "occurred_at"
    search_fields = ("order_id",)
