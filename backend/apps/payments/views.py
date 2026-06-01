"""Vues paiement + webhooks providers."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order

from .models import Payment, PaymentProvider as PaymentProviderModel, WalletTransaction
from .providers import get_provider
from .serializers import (
    InitiatePaymentSerializer,
    PaymentSerializer,
    WalletTransactionSerializer,
)
from .services import capture_payment, initiate_payment


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "provider", "order"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all()
        return Payment.objects.filter(customer=user)

    @action(detail=False, methods=["post"])
    def initiate(self, request):
        s = InitiatePaymentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        order = get_object_or_404(Order, id=s.validated_data["order_id"])
        if order.customer != request.user and not request.user.is_staff:
            return Response({"detail": "Forbidden"}, status=403)
        payment = initiate_payment(
            order=order,
            provider_code=s.validated_data["provider"],
            return_url=s.validated_data["return_url"],
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return WalletTransaction.objects.all()
        if hasattr(user, "printer_profile"):
            return WalletTransaction.objects.filter(printer=user.printer_profile)
        return WalletTransaction.objects.none()


# ============================================================
# Webhooks providers — endpoints publics signés
# ============================================================
@api_view(["POST"])
@permission_classes([AllowAny])
def stripe_webhook(request):
    provider = get_provider("stripe")
    event = provider.verify_webhook(request)
    if not event:
        return Response({"detail": "invalid signature"}, status=400)
    if event.get("type") == "checkout.session.completed":
        data = event["data"]["object"]
        ref = data.get("client_reference_id")
        payment = Payment.objects.filter(reference=ref).first()
        if payment:
            capture_payment(payment)
    return Response({"received": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def cinetpay_webhook(request):
    provider = get_provider("cinetpay")
    event = provider.verify_webhook(request)
    if not event:
        return Response({"detail": "invalid signature"}, status=400)
    ref = event.get("cpm_trans_id") or event.get("transaction_id")
    payment = Payment.objects.filter(reference=ref).first()
    if payment and event.get("cpm_result") == "00":
        capture_payment(payment)
    return Response({"received": True})


@api_view(["POST"])
@permission_classes([AllowAny])
def wave_webhook(request):
    provider = get_provider("wave")
    event = provider.verify_webhook(request)
    if not event:
        return Response({"detail": "invalid signature"}, status=400)
    ref = event.get("client_reference") or event.get("transaction_id")
    payment = Payment.objects.filter(reference=ref).first()
    if payment and event.get("status") in {"success", "completed", "paid"}:
        capture_payment(payment)
    return Response({"received": True})
