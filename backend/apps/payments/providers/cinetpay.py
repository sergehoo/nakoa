"""Provider CinetPay — agrégateur leader en UEMOA (Mobile Money + carte)."""

from __future__ import annotations

import hashlib
import json
from decimal import Decimal

import requests

from .base import PaymentProvider, PaymentResult


CINETPAY_INIT_URL = "https://api-checkout.cinetpay.com/v2/payment"


class CinetPayProvider(PaymentProvider):
    code = "cinetpay"

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        payload = {
            "apikey": self.config.get("api_key", ""),
            "site_id": self.config.get("site_id", ""),
            "transaction_id": reference,
            "amount": int(Decimal(amount)),
            "currency": currency,
            "description": f"PrintHub commande {reference}",
            "customer_email": customer_email,
            "notify_url": self.config.get("notify_url", ""),
            "return_url": return_url,
            "channels": "ALL",
            "metadata": json.dumps(metadata or {}),
            "lang": "fr",
        }
        try:
            r = requests.post(CINETPAY_INIT_URL, json=payload, timeout=10)
            data = r.json()
            if data.get("code") == "201":
                return PaymentResult(
                    success=True,
                    provider_reference=reference,
                    checkout_url=data["data"].get("payment_url", ""),
                    raw=data,
                )
            return PaymentResult(success=False, error=data.get("message", "init failed"), raw=data)
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        """Vérifie le HMAC du webhook CinetPay (x-token)."""
        body = request.body
        secret = self.config.get("secret", "")
        expected = hashlib.sha256(body + secret.encode()).hexdigest()
        provided = request.headers.get("X-TOKEN", "")
        if not provided or provided != expected:
            return None
        try:
            return json.loads(body)
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        # CinetPay : remboursements via support manuel à la phase 1
        return PaymentResult(success=False, error="refund_manual_required")
