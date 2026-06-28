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


@api_view(["POST"])
@permission_classes([AllowAny])
def paystack_webhook(request):
    """Webhook Paystack — vérification HMAC SHA512 sur secret_key.

    Events traités :
    - charge.success → capture le paiement
    - charge.failed  → marque l'échec (logged uniquement)
    - refund.processed → log
    """
    provider = get_provider("paystack")
    event = provider.verify_webhook(request)
    if not event:
        return Response({"detail": "invalid signature"}, status=400)

    event_type = event.get("event", "")
    data = event.get("data", {})
    ref = data.get("reference")

    if not ref:
        return Response({"received": True, "ignored": "no reference"})

    payment = Payment.objects.filter(reference=ref).first()
    if not payment:
        return Response({"received": True, "ignored": "payment not found"})

    if event_type == "charge.success":
        capture_payment(payment)
    elif event_type == "charge.failed":
        payment.status = "failed"
        payment.failed_reason = data.get("gateway_response", "Paystack: failed")
        payment.save(update_fields=["status", "failed_reason"])

    return Response({"received": True, "event": event_type})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    """Endpoint manuel : le frontend appelle après le retour callback du provider
    pour confirmer immédiatement le paiement (sans attendre le webhook).

    GET /api/v1/payments/verify/?reference=PAY_ABC123
    """
    ref = request.query_params.get("reference")
    if not ref:
        return Response({"detail": "reference required"}, status=400)

    payment = Payment.objects.filter(reference=ref).first()
    if not payment:
        return Response({"detail": "payment not found"}, status=404)

    # Sécurité : seul le client propriétaire ou un staff peut vérifier
    if payment.customer != request.user and not request.user.is_staff:
        return Response({"detail": "forbidden"}, status=403)

    # Si déjà capturé, on renvoie l'état actuel
    if payment.status in {"captured", "succeeded"}:
        return Response(PaymentSerializer(payment).data)

    # Vérification active auprès du provider (Paystack uniquement pour l'instant)
    if payment.provider == "paystack":
        import requests
        from django.conf import settings as dj_settings
        cfg = (dj_settings.PAYMENT_PROVIDERS or {}).get("paystack", {})
        secret = cfg.get("secret_key", "")
        try:
            r = requests.get(
                f"https://api.paystack.co/transaction/verify/{ref}",
                headers={"Authorization": f"Bearer {secret}"},
                timeout=10,
            )
            data = r.json()
            if data.get("status") and data["data"].get("status") == "success":
                capture_payment(payment)
                payment.refresh_from_db()
        except Exception:  # noqa: BLE001
            pass

    return Response(PaymentSerializer(payment).data)
