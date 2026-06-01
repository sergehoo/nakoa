"""Endpoints Marketplace Intelligence."""

from dataclasses import asdict

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import PrinterProfile
from .services.marketplace_intelligence import (
    compute_marketplace_rank,
    filter_by_badge,
    top_printers,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def printer_marketplace_rank(request, slug):
    printer = get_object_or_404(PrinterProfile, slug=slug, status="active")
    rank = compute_marketplace_rank(printer)
    return Response(asdict(rank))


@api_view(["GET"])
@permission_classes([AllowAny])
def top_ranking(request):
    country = request.query_params.get("country")
    category = request.query_params.get("category")
    limit = int(request.query_params.get("limit", 20))
    ranks = top_printers(country=country, category_slug=category, limit=limit)
    return Response({
        "count": len(ranks),
        "results": [asdict(r) for r in ranks],
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def by_badge(request, badge):
    """Imprimeurs filtrés par badge : premium, verified, express, trusted, top_seller, ai_recommended."""
    if badge not in {"premium", "verified", "express", "trusted", "top_seller", "ai_recommended"}:
        return Response({"detail": "invalid badge"}, status=400)
    country = request.query_params.get("country")
    limit = int(request.query_params.get("limit", 20))
    ranks = filter_by_badge(badge, country=country, limit=limit)
    return Response({
        "badge": badge,
        "count": len(ranks),
        "results": [asdict(r) for r in ranks],
    })
