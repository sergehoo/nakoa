"""Tâches Celery IA — analyses asynchrones."""

from celery import shared_task

from apps.documents.models import Document
from apps.orders.models import Order

from .services import analyze_bat


@shared_task(name="ai.analyze_bat", queue="ai")
def analyze_bat_task(order_id: str, document_id: str) -> str:
    order = Order.objects.get(id=order_id)
    document = Document.objects.get(id=document_id)
    analysis = analyze_bat(order=order, document=document)
    return str(analysis.id)
