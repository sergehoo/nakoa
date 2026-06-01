"""Registry dynamique des providers de paiement selon settings.PAYMENT_PROVIDERS."""

from __future__ import annotations

from django.conf import settings

from .base import PaymentProvider
from .cinetpay import CinetPayProvider
from .flutterwave import FlutterwaveProvider
from .moov import MoovProvider
from .mtn_momo import MTNMoMoProvider
from .orange_money import OrangeMoneyProvider
from .paystack import PaystackProvider
from .stripe import StripeProvider
from .wave import WaveProvider


_PROVIDERS = {
    "stripe": StripeProvider,
    "cinetpay": CinetPayProvider,
    "wave": WaveProvider,
    "orange_money": OrangeMoneyProvider,
    "mtn_momo": MTNMoMoProvider,
    "moov_money": MoovProvider,
    "paystack": PaystackProvider,
    "flutterwave": FlutterwaveProvider,
}


def get_provider(code: str) -> PaymentProvider:
    klass = _PROVIDERS.get(code)
    if not klass:
        raise ValueError(f"Payment provider inconnu: {code}")
    config = settings.PAYMENT_PROVIDERS.get(code, {})
    return klass(config)
