"""Modèles paiement — Payment, Refund, WalletTransaction."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Currency


class PaymentProvider(models.TextChoices):
    STRIPE = "stripe", "Stripe"
    CINETPAY = "cinetpay", "CinetPay"
    PAYSTACK = "paystack", "Paystack"
    FLUTTERWAVE = "flutterwave", "Flutterwave"
    WAVE = "wave", "Wave"
    ORANGE_MONEY = "orange_money", "Orange Money"
    MTN_MOMO = "mtn_momo", "MTN MoMo"
    MOOV_MONEY = "moov_money", "Moov Money"
    BANK_TRANSFER = "bank_transfer", _("Virement bancaire")
    WALLET = "wallet", _("Wallet PrintHub")


class PaymentStatus(models.TextChoices):
    INITIATED = "initiated", _("Initié")
    PENDING = "pending", _("En attente")
    AUTHORIZED = "authorized", _("Autorisé")
    CAPTURED = "captured", _("Capturé (escrow)")
    SUCCEEDED = "succeeded", _("Réussi")
    FAILED = "failed", _("Échoué")
    REFUNDED = "refunded", _("Remboursé")
    PARTIALLY_REFUNDED = "partially_refunded", _("Partiellement remboursé")
    DISPUTED = "disputed", _("En litige")


class Payment(BaseModel):
    reference = models.CharField(max_length=32, unique=True)
    order = models.ForeignKey("orders.Order", on_delete=models.PROTECT, related_name="payments")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="payments",
    )

    provider = models.CharField(max_length=24, choices=PaymentProvider.choices)
    provider_reference = models.CharField(max_length=160, blank=True, db_index=True)
    checkout_url = models.URLField(blank=True)

    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)
    fee = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))

    status = models.CharField(max_length=24, choices=PaymentStatus.choices, default=PaymentStatus.INITIATED, db_index=True)
    escrow_release_after = models.DateTimeField(null=True, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    failed_reason = models.CharField(max_length=255, blank=True)

    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["provider", "provider_reference"]),
            models.Index(fields=["order", "status"]),
        ]


class Refund(BaseModel):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="refunds")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    reason = models.CharField(max_length=255, blank=True)
    provider_reference = models.CharField(max_length=160, blank=True)
    status = models.CharField(max_length=24, default="pending")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="refund_requests",
    )
    processed_at = models.DateTimeField(null=True, blank=True)


class WalletTransaction(BaseModel):
    class Kind(models.TextChoices):
        CREDIT = "credit", _("Crédit")
        DEBIT = "debit", _("Débit")
        HOLD = "hold", _("Mise en attente")
        RELEASE = "release", _("Libération")
        ADJUSTMENT = "adjustment", _("Ajustement manuel")

    printer = models.ForeignKey(
        "printers.PrinterProfile", on_delete=models.CASCADE, related_name="wallet_transactions",
    )
    order = models.ForeignKey(
        "orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="wallet_transactions",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)


class Payout(BaseModel):
    """Versement effectif au compte bancaire/Mobile Money de l'imprimeur."""

    printer = models.ForeignKey("printers.PrinterProfile", on_delete=models.PROTECT, related_name="payouts")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)
    provider = models.CharField(max_length=24, choices=PaymentProvider.choices)
    provider_reference = models.CharField(max_length=160, blank=True)
    status = models.CharField(max_length=24, default="pending")
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
