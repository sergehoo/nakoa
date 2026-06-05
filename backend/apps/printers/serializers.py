from rest_framework import serializers

from .models import (
    DeliveryZone,
    Finish,
    Machine,
    PrinterAgent,
    PrinterProduct,
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


class PrinterProductSerializer(serializers.ModelSerializer):
    """Lien imprimeur ↔ produit catalogue avec ses tarifs/options."""

    product_detail = serializers.SerializerMethodField(read_only=True)
    printer_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PrinterProduct
        fields = [
            "id", "printer", "product",
            "product_detail", "printer_detail",
            "min_price", "setup_cost", "currency",
            "daily_capacity", "standard_lead_time_days", "express_lead_time_days",
            "express_surcharge_pct", "is_express_available",
            "supported_formats", "supported_finishes", "supported_papers",
            "custom_options", "notes",
            "is_active", "orders_count", "last_order_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "printer", "orders_count", "last_order_at",
            "created_at", "updated_at",
        ]

    def get_product_detail(self, obj: PrinterProduct):
        p = obj.product
        cover = p.cover_image.url if p.cover_image else None
        return {
            "id": str(p.id),
            "name": p.name,
            "slug": p.slug,
            "short_description": p.short_description,
            "cover_image": cover,
            "category_id": str(p.category_id),
            "category_name": p.category.name if p.category_id else None,
            "lead_time_days": p.lead_time_days,
            "min_quantity": p.min_quantity,
        }

    def get_printer_detail(self, obj: PrinterProduct):
        p = obj.printer
        return {
            "id": str(p.id),
            "trade_name": p.trade_name or p.legal_name,
            "city": p.city,
            "country": p.country,
            "quality_score": float(p.quality_score),
            "on_time_rate": float(p.on_time_rate),
        }


class PrinterProductPublicSerializer(serializers.ModelSerializer):
    """Vue publique d'une offre imprimeur pour un produit."""

    printer_detail = serializers.SerializerMethodField()

    class Meta:
        model = PrinterProduct
        fields = [
            "id", "min_price", "currency",
            "standard_lead_time_days", "express_lead_time_days",
            "is_express_available", "printer_detail",
        ]

    def get_printer_detail(self, obj: PrinterProduct):
        p = obj.printer
        return {
            "id": str(p.id),
            "trade_name": p.trade_name or p.legal_name,
            "slug": p.slug,
            "city": p.city,
            "country": p.country,
            "quality_score": float(p.quality_score),
            "on_time_rate": float(p.on_time_rate),
            "is_featured": p.is_featured,
        }
