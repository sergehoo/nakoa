"""Provider Orange Money — UEMOA (CI, SN, ML, BF, NE).

Documentation : https://developer.orange.com/apis/om-webpay/
Flow : OAuth client_credentials → webpayment → polling/webhook → notification.
"""

from __future__ import annotations

import base64
import time
from decimal import Decimal

import requests

from .base import PaymentProvider, PaymentResult


ORANGE_TOKEN_URL = "https://api.orange.com/oauth/v3/token"
ORANGE_WEBPAY_URL = "https://api.orange.com/orange-money-webpay/dev/v1/webpayment"


class OrangeMoneyProvider(PaymentProvider):
    code = "orange_money"

    def __init__(self, config):
        super().__init__(config)
        self._token: str | None = None
        self._token_expires: float = 0

    def _get_token(self) -> str | None:
        if self._token and time.time() < self._token_expires - 30:
            return self._token
        client_id = self.config.get("client_id", "")
        secret = self.config.get("client_secret", "")
        if not client_id or not secret:
            return None
        auth = base64.b64encode(f"{client_id}:{secret}".encode()).decode()
        try:
            r = requests.post(
                ORANGE_TOKEN_URL,
                headers={"Authorization": f"Basic {auth}", "Accept": "application/json"},
                data={"grant_type": "client_credentials"},
                timeout=10,
            )
            data = r.json()
            self._token = data.get("access_token")
            self._token_expires = time.time() + int(data.get("expires_in", 3600))
            return self._token
        except Exception:  # noqa: BLE001
            return None

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        token = self._get_token()
        if not token:
            return PaymentResult(success=False, error="orange_money_auth_failed")
        payload = {
            "merchant_key": self.config.get("merchant_key", ""),
            "currency": currency,
            "order_id": reference,
            "amount": int(Decimal(amount)),
            "return_url": return_url,
            "cancel_url": return_url + "?status=cancel",
            "notif_url": self.config.get("notif_url", ""),
            "lang": "fr",
            "reference": reference,
        }
        try:
            r = requests.post(
                ORANGE_WEBPAY_URL,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            data = r.json()
            if data.get("status") == 201 or data.get("pay_token"):
                return PaymentResult(
                    success=True,
                    provider_reference=data.get("pay_token", reference),
                    checkout_url=data.get("payment_url", ""),
                    raw=data,
                )
            return PaymentResult(success=False, error=data.get("message", "orange_init_failed"), raw=data)
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        """Webhook Orange Money — payload signé via x-om-signature (HMAC SHA-256)."""
        body = request.body
        signature = request.headers.get("X-OM-Signature", "")
        # En sandbox : on accepte sans signature pour faciliter les tests
        if not signature and not self.config.get("merchant_key"):
            try:
                import json
                return json.loads(body)
            except Exception:  # noqa: BLE001
                return None
        # En prod : vérifier HMAC avec merchant_key
        try:
            import hashlib
            import hmac
            import json
            expected = hmac.new(
                self.config["merchant_key"].encode(),
                body,
                hashlib.sha256,
            ).hexdigest()
            if not hmac.compare_digest(expected, signature):
                return None
            return json.loads(body)
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        # Orange Money : remboursements via dashboard merchant à la phase 1
        return PaymentResult(success=False, error="refund_manual_required")
