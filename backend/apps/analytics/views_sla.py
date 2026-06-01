"""Endpoints SLA Engine + tâche Celery alertes."""

from __future__ import annotations

from dataclasses import asdict

from celery import shared_task
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.printers.models import PrinterProfile

from .services.sla import compute_printer_sla, compute_regional_sla, detect_sla_breaches


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_sla(request):
    if not hasattr(request.user, "printer_profile"):
        return Response({"detail": "no printer profile"}, status=403)
    days = int(request.query_params.get("days", 30))
    sla = compute_printer_sla(request.user.printer_profile, days)
    return Response(asdict(sla))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def printer_sla(request, printer_id):
    printer = get_object_or_404(PrinterProfile, id=printer_id)
    days = int(request.query_params.get("days", 30))
    sla = compute_printer_sla(printer, days)
    return Response(asdict(sla))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def regional_sla(request):
    country = request.query_params.get("country")
    days = int(request.query_params.get("days", 30))
    return Response(compute_regional_sla(country, days))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def sla_breaches_now(request):
    """Liste temps réel des breaches SLA en cours."""
    breaches = detect_sla_breaches()
    return Response({
        "count": len(breaches),
        "breaches": breaches,
    })


@shared_task(name="analytics.sla_alerts_scan")
def sla_alerts_scan():
    """Scan SLA toutes les 5 minutes — déclenche notifications aux admins + imprimeurs concernés."""
    from apps.notifications.tasks import notify_user

    breaches = detect_sla_breaches()
    if not breaches:
        return 0

    # Group by printer
    by_printer: dict[str, list[dict]] = {}
    for b in breaches:
        pid = b.get("printer")
        if pid:
            by_printer.setdefault(pid, []).append(b)

    # Notifications imprimeurs concernés
    from apps.printers.models import PrinterProfile
    for pid, items in by_printer.items():
        printer = PrinterProfile.objects.filter(id=pid).first()
        if printer and printer.owner_id:
            critical = [i for i in items if i["severity"] == "critical"]
            if critical:
                notify_user.delay(
                    user_id=str(printer.owner_id),
                    kind="sla_breach_critical",
                    payload={"count": len(critical), "items": critical[:5]},
                )

    return len(breaches)
