from rest_framework import serializers

from .models import CustomerCompany, CustomerCompanyMember, CustomerProfile


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            "id", "segment", "company_name", "tax_id", "industry", "country",
            "loyalty_points", "lifetime_value", "total_orders", "last_order_at",
            "tags", "created_at",
        ]
        read_only_fields = [
            "id", "loyalty_points", "lifetime_value", "total_orders",
            "last_order_at", "created_at",
        ]


class CustomerCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerCompany
        fields = [
            "id", "name", "legal_name", "rccm_number", "tax_id", "country",
            "billing_email", "credit_limit", "payment_terms_days", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CustomerCompanyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerCompanyMember
        fields = ["id", "company", "user", "role", "is_active"]
        read_only_fields = ["id"]
