from rest_framework import serializers

from .models import (
    DeliveryZone,
    Finish,
    Machine,
    PrinterAgent,
    PrinterProfile,
    ProductionCapability,
)


class MachineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Machine
        fields = "__all__"
        read_only_fields = ["id", "printer", "created_at", "updated_at"]


class FinishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Finish
        fields = "__all__"
        read_only_fields = ["id", "printer", "created_at", "updated_at"]


class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        exclude = ["polygon"]
        read_only_fields = ["id", "printer", "created_at", "updated_at"]


class ProductionCapabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionCapability
        fields = "__all__"
        read_only_fields = ["id", "printer", "created_at", "updated_at"]


class PrinterAgentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = PrinterAgent
        fields = ["id", "user", "email", "role", "can_manage_orders", "can_manage_pricing", "can_manage_team", "is_active"]
        read_only_fields = ["id"]


class PrinterProfileSerializer(serializers.ModelSerializer):
    machines = MachineSerializer(many=True, read_only=True)
    finishes = FinishSerializer(many=True, read_only=True)

    class Meta:
        model = PrinterProfile
        fields = [
            "id", "legal_name", "trade_name", "slug", "description",
            "logo", "banner", "country", "city", "address",
            "delivery_radius_km", "daily_capacity_units", "current_load_pct",
            "quality_score", "on_time_rate", "response_time_minutes",
            "status", "kyc_status", "is_featured",
            "business_hours", "machines", "finishes", "created_at",
        ]
        read_only_fields = [
            "id", "current_load_pct", "quality_score", "on_time_rate",
            "status", "kyc_status", "is_featured", "created_at",
        ]


class PrinterPublicSerializer(serializers.ModelSerializer):
    """Vue publique limitée."""

    class Meta:
        model = PrinterProfile
        fields = [
            "id", "trade_name", "slug", "description", "logo", "banner",
            "country", "city", "delivery_radius_km", "quality_score",
            "on_time_rate", "response_time_minutes", "is_featured",
        ]
