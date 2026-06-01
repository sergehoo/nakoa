"""Endpoints agrégés pour dashboards admin / imprimeur / client."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.orders.models import Order, OrderStatus
from apps.payments.models import Payment
from apps.printers.models import PrinterProfile


def _date_range_filter(qs, field: str, days: int):
    since = timezone.now() - timedelta(days=days)
    return qs.filter(**{f"{field}__gte": since})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    since = timezone.now() - timedelta(days=30)
    orders = Order.objects.all()
    return Response({
        "gmv_30d": orders.filter(paid_at__gte=since).aggregate(s=Sum("total_incl_tax"))["s"] or 0,
        "orders_30d": orders.filter(created_at__gte=since).count(),
        "orders_paid_30d": orders.filter(paid_at__gte=since).count(),
        "active_printers": PrinterProfile.objects.filter(status="active").count(),
        "pending_kyc": PrinterProfile.objects.filter(status="pending").count(),
        "avg_basket_30d": orders.filter(paid_at__gte=since).aggregate(a=Avg("total_incl_tax"))["a"] or 0,
        "status_breakdown": list(orders.values("status").annotate(count=Count("id"))),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def printer_dashboard(request):
    if not hasattr(request.user, "printer_profile"):
        return Response({"detail": "no printer profile"}, status=403)
    printer = request.user.printer_profile
    since = timezone.now() - timedelta(days=30)
    qs = Order.objects.filter(printer=printer)
    return Response({
        "ca_30d": qs.filter(paid_at__gte=since).aggregate(s=Sum("printer_payout"))["s"] or 0,
        "orders_30d": qs.filter(created_at__gte=since).count(),
        "in_production": qs.filter(status=OrderStatus.IN_PRODUCTION).count(),
        "to_accept": qs.filter(status=OrderStatus.ASSIGNED).count(),
        "wallet_balance": str(printer.wallet_balance),
        "quality_score": str(printer.quality_score),
        "on_time_rate": str(printer.on_time_rate),
        "current_load_pct": str(printer.current_load_pct),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def customer_dashboard(request):
    qs = Order.objects.filter(customer=request.user)
    return Response({
        "total_orders": qs.count(),
        "in_progress": qs.exclude(status__in=[
            OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED,
        ]).count(),
        "delivered": qs.filter(status__in=[OrderStatus.DELIVERED, OrderStatus.COMPLETED]).count(),
        "lifetime_spend": qs.aggregate(s=Sum("total_incl_tax"))["s"] or Decimal("0"),
        "last_5": list(qs.order_by("-created_at").values(
            "id", "reference", "status", "total_incl_tax", "currency", "created_at",
        )[:5]),
    })
