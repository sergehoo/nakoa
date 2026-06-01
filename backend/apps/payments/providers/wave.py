"""Provider Wave — Mobile Money CI/SN avec très faibles frais."""

from __future__ import annotations

import requests

from .base import PaymentProvider, PaymentResult


WAVE_API = "https://api.wave.com/v1/checkout/sessions"


class WaveProvider(PaymentProvider):
    code = "wave"

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        headers = {"Authorization": f"Bearer {self.config.get('api_key', '')}"}
        payload = {
            "amount": str(int(amount)),
            "currency": currency,
            "client_reference": reference,
            "success_url": return_url,
            "error_url": return_url,
        }
        try:
            r = requests.post(WAVE_API, json=payload, headers=headers, timeout=10)
            data = r.json()
            if r.status_code in (200, 201):
                return PaymentResult(
                    success=True,
                    provider_reference=data.get("id", reference),
                    checkout_url=data.get("wave_launch_url", ""),
                    raw=data,
                )
            return PaymentResult(success=False, error=data.get("message", "wave_failed"))
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        # Wave envoie un header X-Wave-Signature à vérifier (HMAC SHA-256)
        try:
            return request.data if hasattr(request, "data") else None
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        return PaymentResult(success=False, error="not_implemented")
