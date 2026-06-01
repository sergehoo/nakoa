"""Provider Stripe — utilisé pour CB internationale et abonnements SaaS imprimeur."""

from __future__ import annotations

from decimal import Decimal

import stripe

from .base import PaymentProvider, PaymentResult


class StripeProvider(PaymentProvider):
    code = "stripe"

    def __init__(self, config):
        super().__init__(config)
        stripe.api_key = config.get("secret_key", "")

    def initiate_checkout(self, *, amount, currency, reference, customer_email, return_url, metadata=None):
        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                customer_email=customer_email,
                line_items=[{
                    "price_data": {
                        "currency": currency.lower(),
                        "product_data": {"name": f"PrintHub — Commande {reference}"},
                        "unit_amount": int(Decimal(amount) * 100),
                    },
                    "quantity": 1,
                }],
                client_reference_id=reference,
                success_url=return_url + "?status=success",
                cancel_url=return_url + "?status=cancel",
                metadata=metadata or {},
            )
            return PaymentResult(
                success=True,
                provider_reference=session.id,
                checkout_url=session.url,
                raw=session.to_dict(),
            )
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))

    def verify_webhook(self, request) -> dict | None:
        signature = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            event = stripe.Webhook.construct_event(
                payload=request.body,
                sig_header=signature,
                secret=self.config.get("webhook_secret", ""),
            )
            return event.to_dict()
        except Exception:  # noqa: BLE001
            return None

    def refund(self, *, provider_reference, amount=None):
        try:
            payload = {"payment_intent": provider_reference}
            if amount is not None:
                payload["amount"] = int(Decimal(amount) * 100)
            refund = stripe.Refund.create(**payload)
            return PaymentResult(success=True, provider_reference=refund.id, raw=refund.to_dict())
        except Exception as exc:  # noqa: BLE001
            return PaymentResult(success=False, error=str(exc))
