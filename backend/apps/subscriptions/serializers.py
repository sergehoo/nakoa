"""Sérialiseurs du Subscription Engine."""

from __future__ import annotations

from rest_framework import serializers

from .models import Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    """Sérialiseur public (lecture seule par défaut, exposé sur /pricing)."""

    tier_label = serializers.CharField(source="get_tier_display", read_only=True)
    target_role_label = serializers.CharField(source="get_target_role_display", read_only=True)

    class Meta:
        model = Plan
        fields = [
            "id", "code", "tier", "tier_label", "name", "description", "tagline",
            "monthly_price", "yearly_price", "currency",
            "commission_pct",
            "max_active_orders", "max_team_members", "max_products", "ai_messages_per_month",
            "features", "quotas",
            "trial_days", "cta_label",
            "is_active", "is_public", "is_highlight", "sort_order",
            "target_role", "target_role_label",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "tier_label", "target_role_label")


class SubscriptionSerializer(serializers.ModelSerializer):
    """Sérialiseur d'abonnement utilisateur, enrichi du plan."""

    plan_detail = PlanSerializer(source="plan", read_only=True)
    subscriber_email = serializers.CharField(source="subscriber.email", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id", "subscriber", "subscriber_email",
            "plan", "plan_detail",
            "cycle", "status",
            "started_at", "current_period_end", "trial_ends_at",
            "cancelled_at", "cancellation_reason",
            "provider_reference", "auto_renew",
            "created_at",
        ]
        read_only_fields = (
            "id", "subscriber", "subscriber_email", "plan_detail",
            "started_at", "current_period_end", "trial_ends_at",
            "cancelled_at", "provider_reference",
            "created_at",
        )


class SubscribeRequestSerializer(serializers.Serializer):
    """Payload pour POST /subscriptions/subscribe/."""

    plan = serializers.CharField(help_text="ID ou code du plan.")
    cycle = serializers.ChoiceField(
        choices=Subscription.BillingCycle.choices,
        default=Subscription.BillingCycle.MONTHLY,
    )
    start_trial = serializers.BooleanField(default=True)
    provider_reference = serializers.CharField(required=False, allow_blank=True)


class CancelRequestSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
