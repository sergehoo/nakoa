"""Provider Flutterwave — Pan-africain (cartes + MoMo + USSD + bank transfer).

Documentation : https://developer.flutterwave.com/
"""

from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal

import requests

from .base import PaymentProvider, PaymentResult


FW_BASE = "https://api.flutterwave.com/v3"


class FlutterwaveProvider(PaymentProvider):
    code = "flutterwave"

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        try:
            r = requests.post(
                f"{FW_BASE}/payments",
                headers={
                    "Authorization": f"Bearer {self.config.get('secret_key', '')}",
                    "Content-Type": "application/json",
                },
                json={
                    "tx_ref": reference,
                    "amount": str(Decimal(amount)),
                    "currency": currency,
                    "redirect_url": return_url,
                    "customer": {"email": customer_email},
                    "customizations": {
                        "title": "PrintHub",
                        "description": f"Commande {reference}",
                    },
                    "meta": metadata or {},
                },
                timeout=15,
            )
            data = r.json()
            if data.get("status") == "success":
                return PaymentResult(
                    success=True,
                    provider_reference=reference,
                    checkout_url=data["data"]["link"],
                    raw=data,
                )
            return PaymentResult(success=False, error=data.get("message", "flw_init_failed"), raw=data)
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        signature = request.headers.get("verif-hash", "")
        if signature != self.config.get("hash", ""):
            return None
        try:
            return json.loads(request.body)
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        try:
            r = requests.post(
                f"{FW_BASE}/transactions/{provider_reference}/refund",
                headers={"Authorization": f"Bearer {self.config.get('secret_key', '')}"},
                json={"amount": str(Decimal(amount))} if amount else {},
                timeout=10,
            )
            data = r.json()
            if data.get("status") == "success":
                return PaymentResult(success=True, raw=data)
            return PaymentResult(success=False, error=data.get("message", "flw_refund_failed"))
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))
