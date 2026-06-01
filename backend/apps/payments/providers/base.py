"""Interface PaymentProvider — tous les providers concrets l'implémentent."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any


@dataclass
class PaymentResult:
    success: bool
    provider_reference: str = ""
    checkout_url: str = ""
    raw: dict[str, Any] = field(default_factory=dict)
    error: str = ""


class PaymentProvider(ABC):
    """Contrat commun à tous les providers (Stripe, CinetPay, Wave...)."""

    code: str = "base"

    def __init__(self, config: dict[str, Any]):
        self.config = config

    @abstractmethod
    def initiate_checkout(
        self, *, amount: Decimal, currency: str, reference: str, customer_email: str,
        return_url: str, metadata: dict | None = None,
    ) -> PaymentResult:
        ...

    @abstractmethod
    def verify_webhook(self, request) -> dict | None:
        ...

    @abstractmethod
    def refund(self, *, provider_reference: str, amount: Decimal | None = None) -> PaymentResult:
        ...

    def normalize_status(self, raw_status: str) -> str:
        mapping = {
            "succeeded": "succeeded", "success": "succeeded",
            "paid": "succeeded", "completed": "succeeded",
            "captured": "captured",
            "pending": "pending", "processing": "pending",
            "failed": "failed", "error": "failed", "declined": "failed",
            "refunded": "refunded",
        }
        return mapping.get(raw_status.lower(), "pending")
