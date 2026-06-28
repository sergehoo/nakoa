"""Sérialiseurs des Premium Services."""

from __future__ import annotations

from rest_framework import serializers

from .models import OrderService, PremiumService, ServiceCategory


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "slug", "description", "icon", "sort_order", "is_active",
                  "created_at", "updated_at"]
        read_only_fields = ("id", "created_at", "updated_at")


class PremiumServiceSerializer(serializers.ModelSerializer):
    pricing_type_label = serializers.CharField(source="get_pricing_type_display", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = PremiumService
        fields = [
            "id", "code", "name", "description", "short_description", "icon",
            "category", "category_name",
            "pricing_type", "pricing_type_label",
            "base_price", "percentage", "currency",
            "is_active", "is_visible", "is_required",
            "estimated_hours",
            "applies_to_categories",
            "sort_order",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at",
                            "pricing_type_label", "category_name")


class OrderServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    service_code = serializers.CharField(source="service.code", read_only=True)

    class Meta:
        model = OrderService
        fields = [
            "id", "order_id", "service", "service_name", "service_code",
            "quantity", "unit_price", "total", "currency",
            "status", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "unit_price", "total", "created_at", "updated_at",
                            "service_name", "service_code")


class PriceRequestSerializer(serializers.Serializer):
    """Payload pour POST /price/ : sélection client → total prévisionnel."""

    selection = serializers.ListField(
        child=serializers.DictField(),
        help_text="Liste de {service_code: str, quantity: int}",
    )
    order_total = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = serializers.CharField(default="XOF", max_length=8)
