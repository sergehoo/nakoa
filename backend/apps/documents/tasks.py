"""Tâches Celery liées aux documents : génération PDF facture, thumbnails."""

from celery import shared_task


@shared_task(name="documents.generate_invoice_pdf", queue="heavy")
def generate_invoice_pdf(invoice_id: str) -> str:
    """Placeholder — à implémenter avec weasyprint pour génération HTML→PDF."""
    return f"pending:{invoice_id}"
