"""Tests des transitions FSM d'Order."""

import pytest
from django_fsm import TransitionNotAllowed


@pytest.mark.django_db
class TestOrderFSM:
    def test_initial_status_is_draft(self, order):
        from apps.orders.models import OrderStatus
        assert order.status == OrderStatus.DRAFT

    def test_draft_to_quote_pending(self, order):
        from apps.orders.models import OrderStatus
        order.submit_quote()
        order.save()
        assert order.status == OrderStatus.QUOTE_PENDING

    def test_cannot_skip_payment(self, order):
        order.submit_quote()
        order.save()
        # Devis -> doit passer par bat_uploaded ou bat_validated avant payment
        with pytest.raises(TransitionNotAllowed):
            order.mark_paid()

    def test_full_happy_path(self, order):
        from apps.orders.models import OrderStatus
        order.upload_bat()
        order.save()
        assert order.status == OrderStatus.BAT_UPLOADED
        order.validate_bat()
        order.save()
        assert order.status == OrderStatus.BAT_VALIDATED
        order.request_payment()
        order.save()
        order.mark_paid()
        order.save()
        assert order.status == OrderStatus.PAID
        assert order.paid_at is not None

    def test_cancel_from_draft(self, order):
        from apps.orders.models import OrderStatus
        order.cancel(reason="changed mind")
        order.save()
        assert order.status == OrderStatus.CANCELLED
        assert order.cancellation_reason == "changed mind"

    def test_cannot_cancel_completed(self, order):
        from apps.orders.models import OrderStatus
        order.status = OrderStatus.COMPLETED
        order.save()
        with pytest.raises(TransitionNotAllowed):
            order.cancel()
