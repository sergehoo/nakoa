"""Tâches Celery paiements — release escrow automatique, payouts batch."""

from __future__ import annotations

import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="payments.release_escrow_due")
def release_escrow_due():
    """Libère les paiements en escrow dont la deadline est atteinte (J+3 après livraison).

    Programmé via Celery Beat toutes les heures.
    Configuration : `CELERY_BEAT_SCHEDULE["release-escrow-hourly"] = {"task": ..., "schedule": 3600}`.
    """
    from .models import Payment, PaymentStatus
    from .services import release_escrow

    now = timezone.now()
    due_payments = Payment.objects.filter(
        status=PaymentStatus.CAPTURED,
        escrow_release_after__lte=now,
    )
    released_count = 0
    for payment in due_payments:
        try:
            release_escrow(payment)
            released_count += 1
        except Exception as exc:  # noqa: BLE001
            logger.exception("Release escrow failed for %s: %s", payment.reference, exc)
    logger.info("release_escrow_due: %d paiements libérés", released_count)
    return released_count


@shared_task(name="payments.recompute_printer_loads")
def recompute_printer_loads():
    """Recalcule current_load_pct pour chaque imprimeur basé sur jobs en cours.

    Programmé toutes les 15 minutes via Celery Beat.
    """
    from django.db.models import Count, Q

    from apps.printers.models import PrinterProfile

    active_statuses = ["queued", "in_progress", "on_hold"]
    for printer in PrinterProfile.objects.filter(status="active"):
        active_jobs = printer.jobs.filter(status__in=active_statuses).count()
        capacity = max(printer.daily_capacity_units, 1)
        load_pct = min(100, int((active_jobs / capacity) * 100))
        printer.current_load_pct = load_pct
        printer.save(update_fields=["current_load_pct"])
    return PrinterProfile.objects.filter(status="active").count()


@shared_task(name="payments.recompute_printer_scores")
def recompute_printer_scores():
    """Batch nocturne : recalcule le PrintHub Score de chaque imprimeur."""
    from apps.printers.models import PrinterProfile
    from apps.printers.services import compute_printhub_score

    updated = 0
    for printer in PrinterProfile.objects.filter(status="active"):
        try:
            payload = compute_printhub_score(printer)
            printer.metadata["printhub_score"] = payload
            printer.save(update_fields=["metadata"])
            updated += 1
        except Exception as exc:  # noqa: BLE001
            logger.exception("Score recompute failed for %s: %s", printer.slug, exc)
    return updated
