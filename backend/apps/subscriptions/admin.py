from django.contrib import admin

from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = (
        "name", "tier", "code", "monthly_price", "yearly_price",
        "currency", "trial_days", "target_role", "is_public", "is_active", "sort_order",
    )
    list_filter = ("tier", "target_role", "is_active", "is_public", "is_highlight")
    search_fields = ("name", "code", "description", "tagline")
    list_editable = ("monthly_price", "yearly_price", "is_active", "is_public", "sort_order")
    prepopulated_fields = {"code": ("name",)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "subscriber", "plan", "cycle", "status",
        "current_period_end", "auto_renew", "started_at",
    )
    list_filter = ("status", "cycle", "auto_renew", "plan")
    search_fields = ("subscriber__email", "provider_reference")
    readonly_fields = ("created_at", "updated_at")
