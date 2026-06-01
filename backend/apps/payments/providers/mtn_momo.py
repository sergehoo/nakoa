"""Provider MTN Mobile Money — Collection API (CEMAC + UEMOA Ghana Nigeria).

Documentation : https://momodeveloper.mtn.com/
Sandbox : https://sandbox.momodeveloper.mtn.com/
"""

from __future__ import annotations

import base64
import uuid
from decimal import Decimal

import requests

from .base import PaymentProvider, PaymentResult


MOMO_BASE_SANDBOX = "https://sandbox.momodeveloper.mtn.com/collection"
MOMO_BASE_PROD = "https://momoapi.mtn.com/collection"


class MTNMoMoProvider(PaymentProvider):
    code = "mtn_momo"

    def __init__(self, config):
        super().__init__(config)
        self.base_url = MOMO_BASE_PROD if config.get("environment") == "production" else MOMO_BASE_SANDBOX
        self._token: str | None = None

    def _get_token(self) -> str | None:
        api_user = self.config.get("api_user", "")
        api_key = self.config.get("api_key", "")
        sub_key = self.config.get("subscription_key", "")
        if not all([api_user, api_key, sub_key]):
            return None
        auth = base64.b64encode(f"{api_user}:{api_key}".encode()).decode()
        try:
            r = requests.post(
                f"{self.base_url}/token/",
                headers={
                    "Authorization": f"Basic {auth}",
                    "Ocp-Apim-Subscription-Key": sub_key,
                },
                timeout=10,
            )
            self._token = r.json().get("access_token")
            return self._token
        except Exception:  # noqa: BLE001
            return None

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        """MTN MoMo n'a pas de page de checkout — push USSD direct au client.

        Le flow réel :
        1. Récupérer le numéro du payeur (via UI préalable)
        2. POST /v1_0/requesttopay avec X-Reference-Id unique
        3. Polling /v1_0/requesttopay/{ref} ou attendre callback
        """
        token = self._get_token()
        if not token:
            return PaymentResult(success=False, error="momo_auth_failed")
        ext_ref = str(uuid.uuid4())
        payer = (metadata or {}).get("phone")  # E.164 sans +
        if not payer:
            return PaymentResult(success=False, error="momo_phone_required")
        payload = {
            "amount": str(int(Decimal(amount))),
            "currency": currency,
            "externalId": reference,
            "payer": {"partyIdType": "MSISDN", "partyId": payer.lstrip("+")},
            "payerMessage": f"PrintHub {reference}",
            "payeeNote": "Commande PrintHub",
        }
        try:
            r = requests.post(
                f"{self.base_url}/v1_0/requesttopay",
                headers={
                    "Authorization": f"Bearer {token}",
                    "X-Reference-Id": ext_ref,
                    "X-Target-Environment": "mtnci" if self.config.get("environment") == "production" else "sandbox",
                    "Ocp-Apim-Subscription-Key": self.config.get("subscription_key", ""),
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=15,
            )
            if r.status_code == 202:
                return PaymentResult(
                    success=True,
                    provider_reference=ext_ref,
                    checkout_url="",  # USSD push, pas de redirection
                    raw={"status": "accepted", "external_id": ext_ref},
                )
            return PaymentResult(success=False, error=f"momo_init_failed_{r.status_code}", raw=r.json())
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        # MTN MoMo : callbacks signés via Authentication header (hash partagé)
        try:
            import json
            return json.loads(request.body)
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        return PaymentResult(success=False, error="refund_via_disbursement_required")
