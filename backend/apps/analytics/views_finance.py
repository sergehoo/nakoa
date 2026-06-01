"""Endpoints Financial Intelligence."""

from __future__ import annotations

from dataclasses import asdict
from decimal import Decimal

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order
from apps.printers.models import PrinterProfile

from .services.finance import (
    compute_cac,
    compute_ltv,
    compute_order_margin,
    compute_platform_profitability,
    compute_printer_profitability,
    compute_saas_kpis,
)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def order_margin(request, order_id):
    order = get_object_or_404(
        Order.objects.select_related("printer").prefetch_related("payments__refunds"),
        id=order_id,
    )
    margin = compute_order_margin(order)
    return Response({k: float(v) if isinstance(v, Decimal) else v for k, v in asdict(margin).items()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def printer_profitability(request, printer_id=None):
    if printer_id:
        if not request.user.is_staff:
            return Response({"detail": "forbidden"}, status=403)
        printer = get_object_or_404(PrinterProfile, id=printer_id)
    else:
        if not hasattr(request.user, "printer_profile"):
            return Response({"detail": "no printer profile"}, status=403)
        printer = request.user.printer_profile
    days = int(request.query_params.get("days", 30))
    result = compute_printer_profitability(printer, days)
    return Response({k: float(v) if isinstance(v, Decimal) else v for k, v in asdict(result).items()})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def platform_profitability(request):
    days = int(request.query_params.get("days", 30))
    return Response(compute_platform_profitability(days))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def cac_kpi(request):
    spend = request.query_params.get("spend_xof")
    days = int(request.query_params.get("days", 30))
    return Response(compute_cac(days, Decimal(spend) if spend else None))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_ltv(request, customer_id=None):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    if customer_id:
        if not request.user.is_staff:
            return Response({"detail": "forbidden"}, status=403)
        customer = get_object_or_404(User, id=customer_id)
    else:
        customer = request.user
    return Response(compute_ltv(customer))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def saas_kpis(request):
    return Response(compute_saas_kpis())
