"""Provider Paystack — Nigeria + Ghana + Côte d'Ivoire (cartes + Mobile Money).

Documentation : https://paystack.com/docs/api/
"""

from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal

import requests

from .base import PaymentProvider, PaymentResult


PAYSTACK_BASE = "https://api.paystack.co"


class PaystackProvider(PaymentProvider):
    code = "paystack"

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        try:
            r = requests.post(
                f"{PAYSTACK_BASE}/transaction/initialize",
                headers={
                    "Authorization": f"Bearer {self.config.get('secret_key', '')}",
                    "Content-Type": "application/json",
                },
                json={
                    "email": customer_email,
                    "amount": int(Decimal(amount) * 100),  # Paystack utilise les sub-units
                    "currency": currency,
                    "reference": reference,
                    "callback_url": return_url,
                    "metadata": metadata or {},
                },
                timeout=15,
            )
            data = r.json()
            if data.get("status"):
                return PaymentResult(
                    success=True,
                    provider_reference=data["data"]["reference"],
                    checkout_url=data["data"]["authorization_url"],
                    raw=data,
                )
            return PaymentResult(success=False, error=data.get("message", "paystack_init_failed"), raw=data)
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        body = request.body
        signature = request.headers.get("X-Paystack-Signature", "")
        secret = self.config.get("secret_key", "")
        if not secret:
            return None
        expected = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return None
        try:
            return json.loads(body)
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        try:
            payload = {"transaction": provider_reference}
            if amount:
                payload["amount"] = int(Decimal(amount) * 100)
            r = requests.post(
                f"{PAYSTACK_BASE}/refund",
                headers={"Authorization": f"Bearer {self.config.get('secret_key', '')}"},
                json=payload,
                timeout=10,
            )
            data = r.json()
            if data.get("status"):
                return PaymentResult(success=True, provider_reference=data["data"]["id"], raw=data)
            return PaymentResult(success=False, error=data.get("message", "paystack_refund_failed"))
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))
