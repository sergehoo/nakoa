"""Service d'opportunités : déclenchement, notification, réponse, enrichissement catalogue.

Flow :
1. Client crée une QuoteRequest pour un produit donné.
2. Le service `notify_opportunity_if_uncovered()` regarde si des PrinterProduct existent.
3. Si aucun → on notifie tous les imprimeurs actifs du pays compatibles.
4. Les imprimeurs intéressés répondent via QuoteOffer avec is_opportunity_response=True.
5. Quand le client accepte une offre opportunité, on crée automatiquement le PrinterProduct
   correspondant côté imprimeur (auto-enrichissement du catalogue).
"""

from __future__ import annotations

import logging
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import QuoteOffer, QuoteRequest

logger = logging.getLogger(__name__)


def has_active_printer_products(product_id, country: str | None = None) -> bool:
    """Renvoie True si au moins un imprimeur actif propose déjà ce produit."""
    from apps.printers.models import PrinterProduct

    qs = PrinterProduct.objects.filter(
        product_id=product_id,
        is_active=True,
        printer__status="active",
        printer__kyc_status="approved",
    )
    if country:
        qs = qs.filter(printer__country=country)
    return qs.exists()


def get_eligible_printers_for_opportunity(quote_request: QuoteRequest):
    """Liste les imprimeurs à notifier d'une opportunité.

    Critères :
    - status = active
    - KYB approuvé
    - même pays que la livraison (priorité)
    - charge actuelle < 95%
    """
    from apps.printers.models import PrinterProfile

    qs = PrinterProfile.objects.filter(
        status="active",
        kyc_status="approved",
        current_load_pct__lt=95,
    )
    if quote_request.delivery_country:
        qs = qs.filter(country=quote_request.delivery_country)
    return qs.order_by("-quality_score", "-on_time_rate")[:50]


def notify_opportunity_if_uncovered(quote_request: QuoteRequest) -> dict:
    """Détecte si la demande client est une opportunité et notifie les imprimeurs.

    Retourne un dict de stats.
    """
    if has_active_printer_products(quote_request.product_id, quote_request.delivery_country):
        return {"is_opportunity": False, "notified": 0}

    eligible = get_eligible_printers_for_opportunity(quote_request)

    # Envoi des notifications (async via Celery)
    notified = 0
    try:
        from apps.notifications.tasks import notify_user

        for printer in eligible:
            if not printer.owner_id:
                continue
            notify_user.delay(
                user_id=str(printer.owner_id),
                kind="opportunity",
                payload={
                    "quote_request_id": str(quote_request.id),
                    "quote_reference": quote_request.reference,
                    "product_id": str(quote_request.product_id),
                    "product_name": quote_request.product.name,
                    "quantity": quote_request.quantity,
                    "delivery_city": quote_request.delivery_city,
                    "delivery_country": quote_request.delivery_country,
                    "subject": f"Nouvelle opportunité : {quote_request.product.name}",
                    "body": (
                        f"Un client demande {quote_request.quantity} {quote_request.product.name}. "
                        f"Aucun imprimeur ne propose encore ce produit — saisissez cette opportunité !"
                    ),
                },
            )
            notified += 1
    except Exception as exc:  # noqa: BLE001
        logger.exception("Échec notification opportunités : %s", exc)

    return {"is_opportunity": True, "notified": notified, "total_eligible": len(eligible)}


def get_open_opportunities_for_printer(printer):
    """Liste les QuoteRequest ouvertes pour lesquelles cet imprimeur :
    - n'a pas encore activé le produit
    - n'a pas encore répondu
    - status ∈ {open, matched, draft}
    """
    if not printer:
        return QuoteRequest.objects.none()

    from apps.printers.models import PrinterProduct

    activated_product_ids = set(
        PrinterProduct.objects.filter(printer=printer, is_active=True)
        .values_list("product_id", flat=True)
    )
    already_responded_ids = set(
        QuoteOffer.objects.filter(printer=printer, is_active=True)
        .values_list("request_id", flat=True)
    )

    qs = (
        QuoteRequest.objects.filter(
            status__in=["open", "matched"],
            delivery_country=printer.country,
        )
        .exclude(product_id__in=activated_product_ids)
        .exclude(id__in=already_responded_ids)
        .select_related("product", "product__category", "customer")
        .order_by("-created_at")
    )
    return qs


@transaction.atomic
def submit_opportunity_response(
    *,
    quote_request: QuoteRequest,
    printer,
    unit_price: Decimal,
    estimated_lead_time_days: int,
    notes: str = "",
    delivery_fee: Decimal = Decimal("0"),
) -> QuoteOffer:
    """L'imprimeur propose une offre sur une opportunité (produit qu'il n'avait pas activé)."""

    # Évite les doublons
    existing = QuoteOffer.objects.filter(
        request=quote_request, printer=printer, is_active=True,
    ).first()
    if existing:
        return existing

    total_excl = unit_price * quote_request.quantity
    vat_rate = Decimal("18")
    total_incl = total_excl * (1 + vat_rate / 100) + delivery_fee
    expected_delivery = timezone.now() + timezone.timedelta(days=estimated_lead_time_days + 1)

    offer = QuoteOffer.objects.create(
        request=quote_request,
        printer=printer,
        unit_price=unit_price,
        total_excl_tax=total_excl,
        total_incl_tax=total_incl,
        delivery_fee=delivery_fee,
        estimated_lead_time_days=estimated_lead_time_days,
        expected_delivery_at=expected_delivery,
        currency=quote_request.currency,
        is_opportunity_response=True,
        printer_notes=notes,
        quality_score_snapshot=printer.quality_score,
        tag="standard",
        is_active=True,
    )

    # Met à jour la demande
    if quote_request.status == "open":
        quote_request.status = "matched"
        quote_request.matched_at = timezone.now()
        quote_request.save(update_fields=["status", "matched_at"])

    # Notifie le client
    try:
        from apps.notifications.tasks import notify_user
        notify_user.delay(
            user_id=str(quote_request.customer_id),
            kind="new_offer",
            payload={
                "quote_request_id": str(quote_request.id),
                "offer_id": str(offer.id),
                "printer_name": printer.trade_name or printer.legal_name,
                "subject": f"Nouvelle offre pour votre demande {quote_request.reference}",
                "body": f"{printer.trade_name or printer.legal_name} propose votre commande.",
            },
        )
    except Exception:  # noqa: BLE001
        logger.exception("Échec notification client nouvelle offre")

    return offer


@transaction.atomic
def auto_enrich_printer_catalog(offer: QuoteOffer) -> bool:
    """Si une offre opportunité est sélectionnée, ajoute le produit au catalogue de l'imprimeur.

    Idempotent : si le PrinterProduct existe déjà, on ne le recrée pas.
    Renvoie True si un PrinterProduct a été créé.
    """
    if not offer.is_opportunity_response:
        return False

    from apps.printers.models import PrinterProduct

    if PrinterProduct.objects.filter(
        printer=offer.printer, product=offer.request.product,
    ).exists():
        return False

    PrinterProduct.objects.create(
        printer=offer.printer,
        product=offer.request.product,
        min_price=offer.unit_price,
        currency=offer.currency,
        standard_lead_time_days=offer.estimated_lead_time_days,
        express_lead_time_days=max(1, offer.estimated_lead_time_days // 2),
        is_active=True,
        notes=f"Auto-ajouté suite à acceptation d'opportunité (devis {offer.request.reference}).",
    )
    logger.info(
        "Catalogue enrichi : printer=%s product=%s via opportunité %s",
        offer.printer_id, offer.request.product_id, offer.request.reference,
    )
    return True
