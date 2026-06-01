from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "order", "customer", "customer_name", "printer",
            "overall_rating", "quality_rating", "delivery_rating", "communication_rating",
            "title", "body", "photos", "is_verified", "status",
            "printer_response", "printer_response_at", "created_at",
        ]
        read_only_fields = ["id", "customer", "customer_name", "is_verified", "printer_response_at", "created_at"]
