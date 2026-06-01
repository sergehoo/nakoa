"""Services Payment — orchestration paiement, capture, remboursement."""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import PaymentFailed
from apps.core.utils import generate_reference

from .models import Payment, PaymentProvider, PaymentStatus, Refund, WalletTransaction
from .providers import get_provider


def initiate_payment(*, order, provider_code: str, return_url: str) -> Payment:
    provider = get_provider(provider_code)
    reference = generate_reference("PAY")
    payment = Payment.objects.create(
        reference=reference,
        order=order,
        customer=order.customer,
        provider=provider_code,
        amount=order.total_incl_tax,
        currency=order.currency,
        status=PaymentStatus.INITIATED,
    )
    result = provider.initiate_checkout(
        amount=order.total_incl_tax,
        currency=order.currency,
        reference=reference,
        customer_email=order.customer.email,
        return_url=return_url,
        metadata={"order_id": str(order.id), "order_ref": order.reference},
    )
    if not result.success:
        payment.status = PaymentStatus.FAILED
        payment.failed_reason = result.error
        payment.save(update_fields=["status", "failed_reason"])
        raise PaymentFailed(detail=result.error)

    payment.provider_reference = result.provider_reference
    payment.checkout_url = result.checkout_url
    payment.status = PaymentStatus.PENDING
    payment.raw_payload = result.raw
    payment.save(update_fields=["provider_reference", "checkout_url", "status", "raw_payload"])
    return payment


@transaction.atomic
def capture_payment(payment: Payment) -> Payment:
    """Marque le paiement capturé en escrow et déclenche la commande payée."""

    if payment.status in (PaymentStatus.CAPTURED, PaymentStatus.SUCCEEDED):
        return payment
    payment.status = PaymentStatus.CAPTURED
    payment.captured_at = timezone.now()
    payment.escrow_release_after = timezone.now() + timezone.timedelta(hours=72)
    payment.save(update_fields=["status", "captured_at", "escrow_release_after"])

    from apps.orders.services import confirm_payment
    confirm_payment(payment.order, payment_reference=payment.reference)
    return payment


@transaction.atomic
def release_escrow(payment: Payment) -> Payment:
    """Libère les fonds vers le wallet imprimeur (75-95% selon plan)."""

    if payment.status != PaymentStatus.CAPTURED:
        return payment
    order = payment.order
    if not order.printer:
        return payment

    new_balance = order.printer.wallet_balance + order.printer_payout
    WalletTransaction.objects.create(
        printer=order.printer,
        order=order,
        kind=WalletTransaction.Kind.CREDIT,
        amount=order.printer_payout,
        balance_after=new_balance,
        description=f"Paiement commande {order.reference}",
    )
    order.printer.wallet_balance = new_balance
    order.printer.save(update_fields=["wallet_balance"])

    payment.status = PaymentStatus.SUCCEEDED
    payment.released_at = timezone.now()
    payment.save(update_fields=["status", "released_at"])
    return payment


def refund_payment(*, payment: Payment, amount: Decimal | None = None, reason: str = "") -> Refund:
    provider = get_provider(payment.provider)
    result = provider.refund(provider_reference=payment.provider_reference, amount=amount)
    refund = Refund.objects.create(
        payment=payment, amount=amount or payment.amount, reason=reason,
        provider_reference=result.provider_reference,
        status="succeeded" if result.success else "failed",
        processed_at=timezone.now() if result.success else None,
    )
    if result.success:
        payment.status = (
            PaymentStatus.REFUNDED if (amount is None or amount >= payment.amount)
            else PaymentStatus.PARTIALLY_REFUNDED
        )
        payment.save(update_fields=["status"])
    return refund
