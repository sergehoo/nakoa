"""Sérialiseurs du Promotion Engine."""

from __future__ import annotations

from rest_framework import serializers

from .models import CouponCode, CouponRedemption, PromotionCampaign


class PromotionCampaignSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    discount_type_label = serializers.CharField(source="get_discount_type_display", read_only=True)
    codes_count = serializers.IntegerField(source="codes.count", read_only=True)

    class Meta:
        model = PromotionCampaign
        fields = [
            "id", "name", "slug", "description",
            "status", "status_label",
            "discount_type", "discount_type_label", "discount_value", "currency",
            "max_discount_amount", "min_order_amount",
            "starts_at", "ends_at",
            "total_usage_limit", "usage_count", "per_user_limit",
            "conditions", "is_public",
            "codes_count",
            "created_at", "updated_at",
        ]
        read_only_fields = (
            "id", "usage_count", "codes_count", "created_at", "updated_at",
            "status_label", "discount_type_label",
        )

    def validate_conditions(self, value):
        if value in (None, {}):
            return value or {}
        try:
            from apps.revenue_engine.services.rule_engine import RuleEngineError, evaluate_rule
        except ImportError:
            return value
        try:
            evaluate_rule(value, context={})
        except RuleEngineError as exc:
            raise serializers.ValidationError(f"DSL invalide : {exc}") from exc
        return value


class CouponCodeSerializer(serializers.ModelSerializer):
    campaign_name = serializers.CharField(source="campaign.name", read_only=True)
    campaign_status = serializers.CharField(source="campaign.status", read_only=True)
    is_usable_now = serializers.SerializerMethodField()

    class Meta:
        model = CouponCode
        fields = [
            "id", "campaign", "campaign_name", "campaign_status",
            "code",
            "max_redemptions", "redemption_count",
            "is_active", "expires_at",
            "restricted_to_user",
            "is_usable_now",
            "created_at", "updated_at",
        ]
        read_only_fields = (
            "id", "redemption_count", "campaign_name", "campaign_status",
            "is_usable_now", "created_at", "updated_at",
        )

    def get_is_usable_now(self, obj) -> bool:
        return obj.is_usable()


class CouponRedemptionSerializer(serializers.ModelSerializer):
    code_value = serializers.CharField(source="code.code", read_only=True)
    campaign_name = serializers.CharField(source="campaign.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = CouponRedemption
        fields = [
            "id", "code", "code_value",
            "campaign", "campaign_name",
            "user", "user_email", "order_id",
            "discount_amount", "currency",
            "status", "reversal_reason",
            "created_at",
        ]
        read_only_fields = fields


class CouponValidateRequestSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=64)
    order_total = serializers.DecimalField(max_digits=15, decimal_places=2)
    order_id = serializers.UUIDField(required=False, allow_null=True)


class GenerateCodesSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=1000)
    prefix = serializers.CharField(required=False, allow_blank=True, max_length=16, default="")
    length = serializers.IntegerField(min_value=4, max_value=24, default=8)
