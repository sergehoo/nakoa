from rest_framework import serializers

from .models import Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_detail = PlanSerializer(source="plan", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id", "subscriber", "plan", "plan_detail", "cycle", "status",
            "started_at", "current_period_end", "trial_ends_at",
            "cancelled_at", "cancellation_reason", "auto_renew", "created_at",
        ]
        read_only_fields = ["id", "subscriber", "created_at"]
