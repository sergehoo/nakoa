from rest_framework import serializers

from .models import PriceGrid, PriceModifier, PriceTier, PromoCode


class PriceTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceTier
        fields = "__all__"
        read_only_fields = ["id", "grid"]


class PriceModifierSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceModifier
        fields = "__all__"
        read_only_fields = ["id", "grid"]


class PriceGridSerializer(serializers.ModelSerializer):
    tiers = PriceTierSerializer(many=True, read_only=True)
    modifiers = PriceModifierSerializer(many=True, read_only=True)

    class Meta:
        model = PriceGrid
        fields = "__all__"
        read_only_fields = ["id", "printer"]


class QuoteCalcRequestSerializer(serializers.Serializer):
    grid_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    option_value_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    discount_pct = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0)


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = "__all__"
        read_only_fields = ["id", "uses"]
