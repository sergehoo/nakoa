"""Services Order — création depuis devis, transitions guidées."""

from __future__ import annotations

from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import BusinessRuleViolation
from apps.core.utils import generate_reference, percent
from apps.quote_requests.models import QuoteRequest

from .models import Order, OrderStatus


@transaction.atomic
def create_order_from_quote(quote: QuoteRequest) -> Order:
    if not quote.selected_offer:
        raise BusinessRuleViolation("Aucune offre sélectionnée.")
    offer = quote.selected_offer
    commission_pct = Decimal("10")  # TODO: tirer depuis settings.PLATFORM_COMMISSION_PERCENT
    commission = percent(offer.total_excl_tax, commission_pct)
    payout = offer.total_excl_tax - commission

    order = Order.objects.create(
        reference=generate_reference("PH"),
        customer=quote.customer,
        product=quote.product,
        quantity=quote.quantity,
        printer=offer.printer,
        quote_request=quote,
        selected_offer=offer,
        unit_price_excl_tax=offer.unit_price,
        total_excl_tax=offer.total_excl_tax,
        total_incl_tax=offer.total_incl_tax,
        vat_amount=offer.total_incl_tax - offer.total_excl_tax,
        delivery_fee=offer.delivery_fee,
        platform_commission=commission,
        printer_payout=payout,
        currency=offer.currency,
        delivery_country=quote.delivery_country,
        delivery_address={
            "country": quote.delivery_country,
            "city": quote.delivery_city,
            "address": quote.delivery_address,
        },
        expected_delivery_at=offer.expected_delivery_at,
        status=OrderStatus.QUOTED,
        created_by=quote.customer,
    )
    order.option_values.set(quote.option_values.all())
    return order


def confirm_payment(order: Order, payment_reference: str = "") -> Order:
    """Hook appelé par le module payments lorsque le paiement est capturé."""
    order.mark_paid()
    order.metadata.setdefault("payments", []).append({
        "reference": payment_reference,
        "captured_at": timezone.now().isoformat(),
    })
    order.save()
    # Auto-attribution
    if order.printer:
        order.assign_printer()
        order.save()
        # Notification imprimeur via tâche async
        from apps.notifications.tasks import notify_user
        notify_user.delay(
            user_id=str(order.printer.owner_id),
            kind="order_assigned",
            payload={"order_id": str(order.id), "reference": order.reference},
        )
    return order
