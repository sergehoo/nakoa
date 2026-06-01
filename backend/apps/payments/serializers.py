from rest_framework import serializers

from .models import Payment, Payout, Refund, WalletTransaction


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id", "reference", "order", "provider", "provider_reference", "checkout_url",
            "amount", "currency", "fee", "status",
            "escrow_release_after", "captured_at", "released_at", "failed_reason", "created_at",
        ]
        read_only_fields = [
            "id", "reference", "provider_reference", "checkout_url",
            "status", "escrow_release_after", "captured_at",
            "released_at", "failed_reason", "created_at",
        ]


class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    provider = serializers.ChoiceField(
        choices=["stripe", "cinetpay", "wave", "orange_money", "mtn_momo", "paystack", "flutterwave"],
    )
    return_url = serializers.URLField()


class RefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Refund
        fields = "__all__"


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = "__all__"


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = "__all__"
