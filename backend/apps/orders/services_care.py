"""PrintHub Care — garantie qualité automatique 48h.

Si le client signale un défaut de qualité dans les 48h après livraison :
- Remboursement intégral automatique
- Réimpression gratuite proposée
- Provision financière prélevée sur la commission (1,5 %)
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import BusinessRuleViolation

from .models import Order, OrderStatus


CARE_WINDOW_HOURS = 48
CARE_PROVISION_PCT = Decimal("1.5")


def is_care_eligible(order: Order) -> bool:
    """Vérifie si la commande est encore éligible à PrintHub Care."""
    if order.status not in (OrderStatus.DELIVERED, OrderStatus.COMPLETED):
        return False
    if not order.delivered_at:
        return False
    deadline = order.delivered_at + timedelta(hours=CARE_WINDOW_HOURS)
    return timezone.now() <= deadline


def care_deadline(order: Order):
    if not order.delivered_at:
        return None
    return order.delivered_at + timedelta(hours=CARE_WINDOW_HOURS)


@transaction.atomic
def open_care_claim(*, order: Order, reason: str, photos: list[str] | None = None) -> dict:
    """Ouvre une réclamation PrintHub Care.

    Effets :
    - Bascule la commande en `disputed`
    - Gèle le paiement à l'imprimeur si pas encore versé
    - Crée un ticket support haute priorité
    - Notifie support + imprimeur
    """
    if not is_care_eligible(order):
        raise BusinessRuleViolation(
            f"Cette commande n'est plus couverte par PrintHub Care "
            f"(délai de {CARE_WINDOW_HOURS} h dépassé).",
        )

    order.dispute()
    order.metadata.setdefault("care_claims", []).append({
        "reason": reason,
        "photos": photos or [],
        "opened_at": timezone.now().isoformat(),
        "status": "investigating",
    })
    order.save()

    # Création ticket support haute priorité
    try:
        from apps.support.models import Ticket
        from apps.core.utils import generate_reference
        Ticket.objects.create(
            reference=generate_reference("TKT-CARE"),
            requester=order.customer,
            order=order,
            subject=f"[PrintHub Care] Réclamation sur commande {order.reference}",
            category="quality",
            priority="high",
            status="open",
        )
    except Exception:  # noqa: BLE001
        pass

    # Notifications
    try:
        from apps.notifications.tasks import notify_user
        notify_user.delay(
            user_id=str(order.customer_id),
            kind="care_claim_opened",
            payload={"order_ref": order.reference},
        )
        if order.printer_id:
            notify_user.delay(
                user_id=str(order.printer.owner_id),
                kind="care_claim_received",
                payload={"order_ref": order.reference, "reason": reason},
            )
    except Exception:  # noqa: BLE001
        pass

    return {
        "claim_opened": True,
        "order_status": order.status,
        "deadline": care_deadline(order).isoformat() if care_deadline(order) else None,
    }


@transaction.atomic
def resolve_care_claim(
    *,
    order: Order,
    resolution: str,
    refund_amount: Decimal | None = None,
) -> dict:
    """Résout une réclamation PrintHub Care.

    resolution : 'full_refund' | 'partial_refund' | 'reprint' | 'rejected'
    """
    if order.status != OrderStatus.DISPUTED:
        raise BusinessRuleViolation("Aucune réclamation ouverte sur cette commande.")

    if resolution == "full_refund":
        from apps.payments.models import Payment
        from apps.payments.services import refund_payment
        payment = Payment.objects.filter(order=order, status="captured").first()
        if payment:
            refund_payment(payment=payment, reason="PrintHub Care - défaut qualité")
        order.refund()
    elif resolution == "partial_refund" and refund_amount:
        from apps.payments.models import Payment
        from apps.payments.services import refund_payment
        payment = Payment.objects.filter(order=order, status="captured").first()
        if payment:
            refund_payment(payment=payment, amount=refund_amount, reason="PrintHub Care partial")
    elif resolution == "reprint":
        # TODO : créer une nouvelle commande clone pour réimpression gratuite
        pass
    else:
        # Rejet → retour à completed
        order.metadata.setdefault("care_claims_history", []).append({
            "resolution": "rejected",
            "resolved_at": timezone.now().isoformat(),
        })
        order.status = OrderStatus.COMPLETED
        order.save()

    return {"resolved": True, "resolution": resolution}


def compute_care_provision(commission_amount: Decimal) -> Decimal:
    """Calcule la provision PrintHub Care à mettre de côté."""
    return (commission_amount * CARE_PROVISION_PCT / Decimal("100")).quantize(Decimal("0.01"))
