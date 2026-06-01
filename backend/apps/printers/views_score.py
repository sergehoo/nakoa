"""Endpoints PrintHub Score — calcul à la volée + cache + breakdown public."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import PrinterProfile
from .services import compute_printhub_score, badge_label


@api_view(["GET"])
@permission_classes([AllowAny])
def printer_score_public(request, slug):
    """Score public visible sur la fiche imprimeur."""
    printer = get_object_or_404(PrinterProfile, slug=slug, status="active")
    payload = compute_printhub_score(printer)
    return Response({
        "printer": {"slug": printer.slug, "trade_name": printer.trade_name, "city": printer.city},
        "score": payload["score"],
        "score_100": payload["score_100"],
        "badge": payload["badge"],
        "badge_label": badge_label(payload["badge"]),
        "computed_at": payload["computed_at"],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_printer_score(request):
    """Score complet (avec breakdown détaillé) — visible uniquement par l'imprimeur lui-même."""
    if not hasattr(request.user, "printer_profile"):
        return Response({"detail": "Not a printer"}, status=403)
    payload = compute_printhub_score(request.user.printer_profile)
    payload["badge_label"] = badge_label(payload["badge"])
    return Response(payload)
