"""PrintHub Operations Center — tour de contrôle agrégée.

Inspirée d'Uber Control Center, Amazon Operations, Stripe Radar.
Vue temps réel pour : Direction, Support, Exploitation.
"""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone


def compute_ops_overview() -> dict[str, Any]:
    """Snapshot complet de la plateforme à l'instant T."""
    from apps.orders.models import Order, OrderStatus
    from apps.payments.models import Payment, PaymentStatus
    from apps.printers.models import PrinterProfile, PrinterStatus
    from apps.production.models import ProductionJob, JobStatus
    from apps.support.models import Ticket

    now = timezone.now()
    last_hour = now - timedelta(hours=1)
    last_24h = now - timedelta(hours=24)

    # ===== Orders =====
    orders_active = Order.objects.exclude(status__in=[
        OrderStatus.DELIVERED, OrderStatus.COMPLETED,
        OrderStatus.CANCELLED, OrderStatus.REFUNDED,
    ])
    orders_blocked = Order.objects.filter(status=OrderStatus.DISPUTED)
    orders_late = Order.objects.filter(
        expected_delivery_at__lt=now,
        status__in=[OrderStatus.IN_PRODUCTION, OrderStatus.READY_FOR_PICKUP, OrderStatus.IN_DELIVERY],
        delivered_at__isnull=True,
    )
    orders_critical = orders_blocked.union(orders_late.filter(
        expected_delivery_at__lt=now - timedelta(days=2),
    ))

    # ===== Production =====
    prod_in_progress = ProductionJob.objects.filter(status=JobStatus.IN_PROGRESS).count()
    prod_blocked = ProductionJob.objects.filter(status=JobStatus.BLOCKED).count()
    prod_on_hold = ProductionJob.objects.filter(status=JobStatus.ON_HOLD).count()
    prod_incidents_24h = 0
    try:
        from apps.production.models import ProductionIncident
        prod_incidents_24h = ProductionIncident.objects.filter(created_at__gte=last_24h).count()
    except Exception:  # noqa: BLE001
        pass

    overloaded_printers = PrinterProfile.objects.filter(
        status=PrinterStatus.ACTIVE,
        current_load_pct__gte=85,
    ).count()

    # ===== Payments =====
    payments_failed_1h = Payment.objects.filter(
        status=PaymentStatus.FAILED, created_at__gte=last_hour,
    ).count()
    payments_pending = Payment.objects.filter(status=PaymentStatus.PENDING).count()
    refunds_24h = Payment.objects.filter(
        status__in=[PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
        updated_at__gte=last_24h,
    ).count()

    # ===== Support =====
    tickets_open = Ticket.objects.filter(status="open").count()
    tickets_urgent = Ticket.objects.filter(priority="urgent", status__in=["open", "assigned"]).count()
    disputes = orders_blocked.count()

    # ===== Volume temps réel =====
    orders_last_hour = Order.objects.filter(created_at__gte=last_hour).count()
    orders_last_24h = Order.objects.filter(created_at__gte=last_24h).count()
    gmv_last_24h = Order.objects.filter(
        paid_at__gte=last_24h,
        status__in=[OrderStatus.PAID, OrderStatus.IN_PRODUCTION,
                    OrderStatus.DELIVERED, OrderStatus.COMPLETED],
    ).aggregate(s=Sum("total_incl_tax"))["s"] or Decimal("0")

    return {
        "timestamp": now.isoformat(),
        "orders": {
            "active": orders_active.count(),
            "blocked": orders_blocked.count(),
            "late": orders_late.count(),
            "critical": orders_critical.count(),
            "created_last_hour": orders_last_hour,
            "created_last_24h": orders_last_24h,
            "gmv_24h": float(gmv_last_24h),
        },
        "production": {
            "in_progress": prod_in_progress,
            "blocked": prod_blocked,
            "on_hold": prod_on_hold,
            "incidents_24h": prod_incidents_24h,
            "overloaded_printers": overloaded_printers,
        },
        "payments": {
            "failed_last_hour": payments_failed_1h,
            "pending": payments_pending,
            "refunds_24h": refunds_24h,
        },
        "support": {
            "tickets_open": tickets_open,
            "tickets_urgent": tickets_urgent,
            "disputes": disputes,
        },
    }


def compute_realtime_map() -> dict[str, Any]:
    """Données géographiques pour carte temps réel."""
    from apps.printers.models import PrinterProfile, PrinterStatus

    active_printers = []
    for p in PrinterProfile.objects.filter(status=PrinterStatus.ACTIVE).select_related("owner")[:500]:
        if p.geo_point:
            active_printers.append({
                "id": str(p.id),
                "trade_name": p.trade_name,
                "city": p.city,
                "country": p.country,
                "lat": p.geo_point.y,
                "lng": p.geo_point.x,
                "load_pct": float(p.current_load_pct),
                "status": "overloaded" if p.current_load_pct >= 85 else "active",
            })

    return {
        "active_printers": active_printers,
        "computed_at": timezone.now().isoformat(),
    }


def compute_ai_monitoring() -> dict[str, Any]:
    """Anomalies IA + fraude détectée + prédictions de risque."""
    from apps.audit.services.fraud_engine import fraud_console_summary
    from apps.analytics.services.sla import detect_sla_breaches

    fraud = fraud_console_summary(days=7)
    sla_breaches = detect_sla_breaches()

    return {
        "fraud": {
            "critical_printers": fraud["critical_printers_count"],
            "critical_payments": fraud["critical_payments_count"],
        },
        "sla": {
            "breaches_now": len(sla_breaches),
            "by_severity": {
                "critical": sum(1 for b in sla_breaches if b["severity"] == "critical"),
                "high": sum(1 for b in sla_breaches if b["severity"] == "high"),
                "warning": sum(1 for b in sla_breaches if b["severity"] == "warning"),
            },
        },
        "computed_at": timezone.now().isoformat(),
    }


def compute_war_room() -> dict[str, Any]:
    """Vue stratégique War Room — agrégation complète pour écran direction."""
    return {
        "overview": compute_ops_overview(),
        "map": compute_realtime_map(),
        "ai_monitoring": compute_ai_monitoring(),
    }
