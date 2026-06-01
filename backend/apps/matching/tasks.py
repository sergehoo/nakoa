from celery import shared_task

from apps.quote_requests.models import QuoteRequest

from .services import MatchingEngine


@shared_task(name="matching.run_matching")
def run_matching(quote_request_id: str) -> int:
    qr = QuoteRequest.objects.select_related("product").get(id=quote_request_id)
    engine = MatchingEngine(qr)
    offers = engine.run()
    # Notification client
    from apps.notifications.tasks import notify_user
    notify_user.delay(
        user_id=str(qr.customer_id),
        kind="quote_offers_ready",
        payload={"quote_request_id": str(qr.id), "offers_count": len(offers)},
    )
    return len(offers)
