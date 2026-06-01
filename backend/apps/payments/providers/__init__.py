"""Interface unifiée des providers de paiement."""

from .base import PaymentProvider, PaymentResult
from .registry import get_provider

__all__ = ["PaymentProvider", "PaymentResult", "get_provider"]
