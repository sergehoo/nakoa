from rest_framework import serializers

from apps.catalog.serializers import ProductListSerializer
from apps.printers.serializers import PrinterPublicSerializer

from .models import QuoteOffer, QuoteRequest


class QuoteOfferSerializer(serializers.ModelSerializer):
    printer = PrinterPublicSerializer(read_only=True)

    class Meta:
        model = QuoteOffer
        fields = [
            "id", "printer", "total_excl_tax", "total_incl_tax", "unit_price",
            "currency", "delivery_fee", "expected_delivery_at",
            "estimated_lead_time_days", "tag", "score", "is_ai_recommended",
            "quality_score_snapshot", "breakdown", "created_at",
        ]


class QuoteRequestSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)
    offers = QuoteOfferSerializer(many=True, read_only=True)

    class Meta:
        model = QuoteRequest
        fields = [
            "id", "reference", "customer", "product", "product_detail",
            "quantity", "option_values", "budget_min", "budget_max",
            "currency", "desired_delivery_at", "delivery_country",
            "delivery_city", "delivery_address", "customer_notes",
            "initial_bat_file", "status", "matched_at", "expires_at",
            "offers", "created_at",
        ]
        read_only_fields = [
            "id", "reference", "customer", "status", "matched_at",
            "expires_at", "created_at",
        ]
