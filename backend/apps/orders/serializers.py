from rest_framework import serializers

from apps.catalog.serializers import ProductListSerializer
from apps.printers.serializers import PrinterPublicSerializer

from .models import Order, OrderItem, OrderStatusHistory


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ["id", "from_status", "to_status", "actor_email", "note", "created_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"
        read_only_fields = ["id", "order"]


class OrderSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)
    printer_detail = PrinterPublicSerializer(source="printer", read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "reference", "customer", "customer_email", "printer", "printer_detail",
            "product", "product_detail", "quantity",
            "unit_price_excl_tax", "total_excl_tax", "vat_rate", "vat_amount",
            "total_incl_tax", "delivery_fee", "discount_amount",
            "platform_commission", "printer_payout", "currency",
            "delivery_address", "delivery_country", "expected_delivery_at",
            "delivered_at", "status", "paid_at", "accepted_at",
            "cancelled_at", "cancellation_reason", "customer_notes", "printer_notes",
            "status_history", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "reference", "customer", "customer_email",
            "platform_commission", "printer_payout", "status",
            "paid_at", "accepted_at", "delivered_at", "cancelled_at",
            "status_history", "created_at", "updated_at",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    printer_name = serializers.CharField(source="printer.trade_name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "reference", "product_name", "printer_name", "quantity",
            "total_incl_tax", "currency", "status",
            "expected_delivery_at", "created_at",
        ]
