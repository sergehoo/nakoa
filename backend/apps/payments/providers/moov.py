"""Provider Moov Money — CI, BJ, TG, BF (via partenariat agrégateur)."""

from __future__ import annotations

from decimal import Decimal

import requests

from .base import PaymentProvider, PaymentResult


MOOV_BASE = "https://api.moov-africa.com/v1"


class MoovProvider(PaymentProvider):
    code = "moov_money"

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        payer = (metadata or {}).get("phone", "")
        try:
            r = requests.post(
                f"{MOOV_BASE}/payment/init",
                headers={
                    "Authorization": f"Bearer {self.config.get('api_key', '')}",
                    "Content-Type": "application/json",
                },
                json={
                    "merchant_id": self.config.get("merchant_id", ""),
                    "reference": reference,
                    "amount": int(Decimal(amount)),
                    "currency": currency,
                    "msisdn": payer,
                    "callback_url": self.config.get("callback_url", ""),
                    "return_url": return_url,
                },
                timeout=15,
            )
            data = r.json()
            if data.get("status") == "ok":
                return PaymentResult(
                    success=True,
                    provider_reference=data.get("transaction_id", reference),
                    checkout_url=data.get("payment_url", ""),
                    raw=data,
                )
            return PaymentResult(success=False, error=data.get("message", "moov_init_failed"))
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        try:
            import json
            return json.loads(request.body)
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        return PaymentResult(success=False, error="refund_via_support_required")
