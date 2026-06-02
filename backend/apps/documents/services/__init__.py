"""Service de génération PDF via WeasyPrint (HTML → PDF).

Note : ce package supplante services.py historique. Voir authentication/services/__init__.py.
"""

from __future__ import annotations

import io
import logging
from typing import Any

from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def render_pdf(template_name: str, context: dict[str, Any]) -> bytes:
    """Rend un template HTML en PDF via WeasyPrint."""
    try:
        from weasyprint import HTML
    except ImportError:
        logger.warning("WeasyPrint non installé — retour PDF vide")
        return b""

    html_str = render_to_string(template_name, context)
    out = io.BytesIO()
    HTML(string=html_str).write_pdf(target=out)
    return out.getvalue()


def render_invoice_pdf(invoice) -> bytes:
    """Génère le PDF d'une facture conforme normes UEMOA."""
    return render_pdf("documents/invoice/invoice.html", {
        "invoice": invoice,
        "lines": list(invoice.lines.all()),
        "company": {
            "name": "Nakoa SARL",
            "legal_form": "SARL au capital de 10 000 000 XOF",
            "rccm": "CI-ABJ-2026-B-12345",
            "tax_id": "CC123456789",
            "address": "Cocody, Abidjan, Côte d'Ivoire",
            "email": "compta@nakoa.io",
            "phone": "+225 27 22 XX XX XX",
        },
    })


def render_quote_pdf(order) -> bytes:
    """Génère le PDF d'un devis."""
    return render_pdf("documents/quote/quote.html", {
        "order": order,
        "customer": order.customer,
        "printer": order.printer,
        "product": order.product,
    })


def render_delivery_note_pdf(order) -> bytes:
    """Génère le bon de livraison avec QR code."""
    qr_data = f"PHDL|{order.reference}|{order.id}"
    return render_pdf("documents/delivery_note/delivery_note.html", {
        "order": order,
        "qr_data": qr_data,
    })


__all__ = [
    "render_pdf",
    "render_invoice_pdf",
    "render_quote_pdf",
    "render_delivery_note_pdf",
]
