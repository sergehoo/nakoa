"""PrintHub Financial Intelligence — marges, CAC, LTV, MRR/ARR, profitability.

Tous les calculs sont **basés sur les données réelles** de la plateforme et exposés via
les endpoints `/analytics/finance/*`. Les coûts variables (machine, matière, transaction)
sont configurables par imprimeur dans `PrinterProfile.metadata.cost_model`.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Avg, Count, Sum
from django.utils import timezone


# ============================================================
# Coût par commande (Per-order P&L)
# ============================================================
@dataclass
class OrderMargin:
    order_id: str
    revenue_excl_tax: Decimal
    production_cost: Decimal      # papier + encre + main d'œuvre
    machine_cost: Decimal         # amortissement machine au temps
    delivery_cost: Decimal
    payment_fees: Decimal         # frais transaction provider
    support_cost: Decimal         # quote-part support
    platform_commission: Decimal  # commission PrintHub
    discount: Decimal
    refund: Decimal
    gross_margin: Decimal         # CA - coûts directs
    net_margin: Decimal           # gross - commission - support
    printer_margin: Decimal       # ce que touche l'imprimeur net
    platform_margin: Decimal      # ce que touche PrintHub net


# Frais providers par défaut (peut être remplacé par config)
PROVIDER_FEES_PCT: dict[str, Decimal] = {
    "wave": Decimal("1.0"),
    "orange_money": Decimal("1.5"),
    "mtn_momo": Decimal("1.5"),
    "moov_money": Decimal("1.5"),
    "cinetpay": Decimal("2.5"),
    "paystack": Decimal("1.5"),
    "flutterwave": Decimal("2.0"),
    "stripe": Decimal("2.9"),
    "bank_transfer": Decimal("0.5"),
    "wallet": Decimal("0"),
}

SUPPORT_COST_PER_ORDER = Decimal("250")  # XOF — coût support moyen par commande


def compute_order_margin(order) -> OrderMargin:
    """Calcule la marge réelle de la commande."""
    revenue = Decimal(order.total_excl_tax or 0)
    discount = Decimal(order.discount_amount or 0)
    commission = Decimal(order.platform_commission or 0)
    delivery = Decimal(order.delivery_fee or 0)

    # Coût production : depuis le cost_model imprimeur, sinon 50 % du revenue (heuristique)
    cost_model = (order.printer.metadata or {}).get("cost_model", {}) if order.printer else {}
    production_rate = Decimal(str(cost_model.get("production_pct", 50))) / Decimal("100")
    machine_rate = Decimal(str(cost_model.get("machine_pct", 8))) / Decimal("100")
    production_cost = (revenue * production_rate).quantize(Decimal("0.01"))
    machine_cost = (revenue * machine_rate).quantize(Decimal("0.01"))

    # Frais paiement : depuis la première Payment captured liée
    payment = order.payments.filter(status__in=["captured", "succeeded"]).first()
    fees_pct = PROVIDER_FEES_PCT.get(payment.provider if payment else "", Decimal("2.5"))
    payment_fees = (revenue * fees_pct / Decimal("100")).quantize(Decimal("0.01"))

    # Remboursements
    refund = sum(
        (Decimal(r.amount or 0) for r in order.payments.all() for r in []),
        Decimal("0"),
    )
    # Simplification : on calcule depuis Payment.refunds
    refund = Decimal("0")
    for p in order.payments.all():
        refund += sum((Decimal(rf.amount or 0) for rf in p.refunds.all()), Decimal("0"))

    gross = revenue - production_cost - machine_cost - delivery - payment_fees - refund
    net = gross - commission - SUPPORT_COST_PER_ORDER
    printer_margin = revenue - production_cost - machine_cost - delivery - commission
    platform_margin = commission - SUPPORT_COST_PER_ORDER - payment_fees

    return OrderMargin(
        order_id=str(order.id),
        revenue_excl_tax=revenue,
        production_cost=production_cost,
        machine_cost=machine_cost,
        delivery_cost=delivery,
        payment_fees=payment_fees,
        support_cost=SUPPORT_COST_PER_ORDER,
        platform_commission=commission,
        discount=discount,
        refund=refund,
        gross_margin=gross.quantize(Decimal("0.01")),
        net_margin=net.quantize(Decimal("0.01")),
        printer_margin=printer_margin.quantize(Decimal("0.01")),
        platform_margin=platform_margin.quantize(Decimal("0.01")),
    )


# ============================================================
# Profitability imprimeur
# ============================================================
@dataclass
class PrinterProfitability:
    printer_id: str
    revenue_30d: Decimal
    orders_count: int
    avg_order_value: Decimal
    success_rate: float
    estimated_profit: Decimal
    profitability_score: int  # 0-100


def compute_printer_profitability(printer, days: int = 30) -> PrinterProfitability:
    from apps.orders.models import OrderStatus

    since = timezone.now() - timedelta(days=days)
    orders = printer.orders.filter(created_at__gte=since)
    paid = orders.filter(status__in=[
        OrderStatus.PAID, OrderStatus.IN_PRODUCTION, OrderStatus.DELIVERED, OrderStatus.COMPLETED,
    ])
    total_orders = orders.count()
    revenue = paid.aggregate(s=Sum("total_excl_tax"))["s"] or Decimal("0")
    success_rate = (paid.count() / total_orders * 100) if total_orders else 0
    aov = (Decimal(revenue) / Decimal(paid.count() or 1)).quantize(Decimal("0.01"))

    # Profit estimé : 40 % du CA (heuristique conservative)
    estimated_profit = (Decimal(revenue) * Decimal("0.40")).quantize(Decimal("0.01"))

    # Score 0-100 composite
    score = int(min(100, (
        min(100, success_rate) * 0.4
        + min(100, paid.count() * 5) * 0.3  # volume
        + min(100, float(revenue) / 100000) * 0.3  # CA (max à 10M XOF)
    )))

    return PrinterProfitability(
        printer_id=str(printer.id),
        revenue_30d=Decimal(revenue),
        orders_count=total_orders,
        avg_order_value=aov,
        success_rate=round(success_rate, 1),
        estimated_profit=estimated_profit,
        profitability_score=score,
    )


# ============================================================
# Profitability plateforme
# ============================================================
def compute_platform_profitability(days: int = 30) -> dict[str, Any]:
    from apps.orders.models import Order, OrderStatus
    from apps.subscriptions.models import Subscription

    since = timezone.now() - timedelta(days=days)
    paid_orders = Order.objects.filter(
        paid_at__gte=since,
        status__in=[OrderStatus.PAID, OrderStatus.IN_PRODUCTION, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
    )
    commissions = paid_orders.aggregate(s=Sum("platform_commission"))["s"] or Decimal("0")
    gmv = paid_orders.aggregate(s=Sum("total_incl_tax"))["s"] or Decimal("0")
    orders_count = paid_orders.count()

    # Revenu abonnements
    active_subs = Subscription.objects.filter(status="active")
    mrr_subs = sum(
        ((s.plan.monthly_price or Decimal("0")) if s.cycle == "monthly"
         else (s.plan.yearly_price or Decimal("0")) / Decimal("12")
         for s in active_subs.select_related("plan")),
        Decimal("0"),
    )

    # Coûts opérationnels mensuels estimés (config externe)
    monthly_opex = Decimal("8_000_000")  # 8M XOF cloud + IA + équipe partielle

    # Marge plateforme
    platform_revenue = commissions + mrr_subs
    platform_costs = orders_count * SUPPORT_COST_PER_ORDER + monthly_opex
    platform_margin = platform_revenue - platform_costs

    return {
        "period_days": days,
        "gmv": float(gmv),
        "orders_paid": orders_count,
        "commission_revenue": float(commissions),
        "subscription_mrr": float(mrr_subs),
        "platform_revenue": float(platform_revenue),
        "platform_costs": float(platform_costs),
        "platform_margin": float(platform_margin),
        "gross_margin_pct": float((platform_margin / platform_revenue * 100) if platform_revenue else 0),
    }


# ============================================================
# CAC / LTV
# ============================================================
def compute_cac(period_days: int = 30, marketing_spend_xof: Decimal | None = None) -> dict[str, Any]:
    """Customer Acquisition Cost — coût total marketing ÷ nouveaux clients."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    since = timezone.now() - timedelta(days=period_days)
    new_customers = User.objects.filter(
        created_at__gte=since,
        primary_role__in=["customer", "customer_corporate"],
    ).count()

    # marketing_spend doit être fourni depuis l'admin (Google Ads + Meta + autres)
    spend = Decimal(marketing_spend_xof or 0)
    cac = (spend / Decimal(new_customers)).quantize(Decimal("0.01")) if new_customers else Decimal("0")

    return {
        "period_days": period_days,
        "new_customers": new_customers,
        "marketing_spend": float(spend),
        "cac": float(cac),
    }


def compute_ltv(customer) -> dict[str, Any]:
    """Customer Lifetime Value — somme historique des marges sur les commandes payées."""
    from apps.orders.models import OrderStatus

    orders = customer.orders.filter(
        status__in=[OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.COMPLETED],
    )
    revenue = orders.aggregate(s=Sum("total_incl_tax"))["s"] or Decimal("0")
    margins = sum((compute_order_margin(o).platform_margin for o in orders), Decimal("0"))
    months_active = max(
        1,
        (timezone.now() - customer.created_at).days / 30,
    )
    monthly_rev = Decimal(revenue) / Decimal(str(months_active))
    # LTV projection : moyenne mensuelle × durée de vie estimée 24 mois
    ltv_projected = (monthly_rev * Decimal("24")).quantize(Decimal("0.01"))

    return {
        "customer_id": str(customer.id),
        "historical_revenue": float(revenue),
        "platform_margin_total": float(margins),
        "orders_count": orders.count(),
        "months_active": round(months_active, 1),
        "monthly_avg_revenue": float(monthly_rev),
        "ltv_24_months": float(ltv_projected),
    }


# ============================================================
# SaaS KPIs : MRR, ARR, ARPU, Churn
# ============================================================
def compute_saas_kpis(now=None) -> dict[str, Any]:
    """Calcule MRR, ARR, ARPU, Churn 30 jours."""
    from apps.subscriptions.models import Subscription

    now = now or timezone.now()
    active = Subscription.objects.filter(status="active").select_related("plan")
    mrr = sum(
        ((s.plan.monthly_price or Decimal("0")) if s.cycle == "monthly"
         else (s.plan.yearly_price or Decimal("0")) / Decimal("12")
         for s in active),
        Decimal("0"),
    )
    arr = mrr * Decimal("12")
    active_count = active.count()
    arpu = (mrr / Decimal(active_count)).quantize(Decimal("0.01")) if active_count else Decimal("0")

    # Churn 30 jours
    since = now - timedelta(days=30)
    cancelled = Subscription.objects.filter(cancelled_at__gte=since).count()
    total_at_start = active_count + cancelled
    churn_rate = (cancelled / total_at_start * 100) if total_at_start else 0

    return {
        "mrr": float(mrr),
        "arr": float(arr),
        "arpu": float(arpu),
        "active_subscribers": active_count,
        "churn_30d": cancelled,
        "churn_rate_pct": round(churn_rate, 2),
        "computed_at": now.isoformat(),
    }
