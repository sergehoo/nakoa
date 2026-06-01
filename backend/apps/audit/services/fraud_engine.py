"""PrintHub Fraud Engine — prévention des fraudes avec 4 trust scores.

Chaque score est un float dans [0, 100] où 100 = totalement fiable, 0 = haut risque.
Les seuils typiques :
- > 80 : OK
- 60-80 : surveillance accrue
- 40-60 : challenge / KYC renforcé
- < 40 : blocage automatique + revue manuelle
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone


@dataclass
class TrustScore:
    score: int       # 0-100
    risk_level: str  # "low" | "medium" | "high" | "critical"
    signals: dict
    recommendations: list[str]


def _risk_level(score: int) -> str:
    if score >= 80:
        return "low"
    if score >= 60:
        return "medium"
    if score >= 40:
        return "high"
    return "critical"


# ============================================================
# 1. Printer Trust Score (faux imprimeurs)
# ============================================================
def printer_trust_score(printer) -> TrustScore:
    signals: dict = {}
    recommendations: list[str] = []
    score = 100.0

    # KYC complet
    if printer.kyc_status != "approved":
        score -= 25
        signals["kyc_incomplete"] = True
        recommendations.append("Compléter la validation KYB")
    else:
        signals["kyc_approved"] = True

    # Documents fournis (RCCM + tax_id non vides)
    if not printer.rccm_number or len(printer.rccm_number) < 5:
        score -= 15
        signals["rccm_missing"] = True
        recommendations.append("Saisir le numéro RCCM officiel")
    if not printer.tax_id:
        score -= 10
        signals["tax_id_missing"] = True

    # Géolocalisation présente
    if not printer.geo_point:
        score -= 10
        signals["no_geo"] = True

    # Photos atelier dans KYC submissions (heuristique)
    workshop_photos = printer.owner.kyc_submissions.filter(
        documents__kind="workshop_photo",
    ).distinct().count() if printer.owner_id else 0
    if workshop_photos < 3:
        score -= 10
        signals["workshop_photos_insufficient"] = True
        recommendations.append("Téléverser au moins 3 photos atelier")

    # Activité : si aucune commande après 60j d'inscription = suspect
    days_since_creation = (timezone.now() - printer.created_at).days
    orders_count = printer.orders.count()
    if days_since_creation > 60 and orders_count == 0:
        score -= 15
        signals["zero_orders_after_60d"] = True
        recommendations.append("Activité initiale anormalement faible")

    # Taux de réclamations sur les commandes traitées
    if orders_count > 0:
        disputed = printer.orders.filter(status="disputed").count()
        dispute_rate = disputed / orders_count
        if dispute_rate > 0.20:
            score -= 25
            signals["high_dispute_rate"] = round(dispute_rate * 100, 1)
            recommendations.append("Taux litiges élevé — revue manuelle requise")

    final = max(0, min(100, int(score)))
    return TrustScore(
        score=final,
        risk_level=_risk_level(final),
        signals=signals,
        recommendations=recommendations,
    )


# ============================================================
# 2. Payment Risk Score
# ============================================================
def payment_risk_score(payment) -> TrustScore:
    signals: dict = {}
    recommendations: list[str] = []
    score = 100.0

    # Customer historique sur la plateforme
    customer = payment.customer
    successful = customer.payments.filter(status__in=["succeeded", "captured"]).count()
    failed = customer.payments.filter(status="failed").count()

    if successful == 0:
        score -= 15
        signals["first_payment"] = True

    # Trop d'échecs récents (3+ en 24h)
    since = timezone.now() - timedelta(hours=24)
    recent_failures = customer.payments.filter(
        status="failed", created_at__gte=since,
    ).count()
    if recent_failures >= 3:
        score -= 35
        signals["multiple_failures_24h"] = recent_failures
        recommendations.append("Verrouiller temporairement le compte client")

    # Refunds abusifs (> 30 % des paiements)
    if successful + failed > 5:
        refund_count = customer.payments.filter(status__in=["refunded", "partially_refunded"]).count()
        refund_rate = refund_count / (successful + failed)
        if refund_rate > 0.30:
            score -= 25
            signals["high_refund_rate"] = round(refund_rate * 100, 1)

    # Montant inhabituel (10× la moyenne historique du client)
    avg_amount = customer.payments.filter(status__in=["succeeded", "captured"]).aggregate(
        avg=Avg("amount"),
    )["avg"] or Decimal("0")
    if avg_amount and Decimal(payment.amount or 0) > avg_amount * 10:
        score -= 20
        signals["unusual_amount"] = float(payment.amount)
        recommendations.append("Montant 10× supérieur à l'historique — vérification 3DS recommandée")

    # Géolocalisation IP vs pays user (heuristique non implémentée ici)
    # TODO : intégrer MaxMind GeoIP

    final = max(0, min(100, int(score)))
    return TrustScore(
        score=final,
        risk_level=_risk_level(final),
        signals=signals,
        recommendations=recommendations,
    )


# ============================================================
# 3. Customer Trust Score (fraude promo, multi-comptes)
# ============================================================
def customer_trust_score(customer) -> TrustScore:
    signals: dict = {}
    recommendations: list[str] = []
    score = 100.0

    # Compte récent + commande grosse immédiate
    age_days = (timezone.now() - customer.created_at).days
    first_order = customer.orders.order_by("created_at").first()
    if first_order and age_days < 1:
        if Decimal(first_order.total_incl_tax or 0) > Decimal("500000"):
            score -= 20
            signals["new_account_large_order"] = True

    # Multi-comptes même IP (heuristique via last_login_ip)
    if customer.last_login_ip:
        same_ip_count = type(customer).objects.filter(
            last_login_ip=customer.last_login_ip,
        ).exclude(id=customer.id).count()
        if same_ip_count >= 3:
            score -= 25
            signals["shared_ip_accounts"] = same_ip_count
            recommendations.append("Multi-comptes détectés sur la même IP")

    # Email pattern suspect (gmail+1, +2, etc.)
    if "+" in (customer.email or ""):
        score -= 10
        signals["plus_email_pattern"] = True

    # Téléphone non vérifié + commandes payées
    if not customer.is_phone_verified and customer.orders.exists():
        score -= 10
        signals["phone_unverified"] = True

    # Abus remboursement
    if customer.orders.count() > 3:
        refund_count = customer.orders.filter(status="refunded").count()
        if refund_count / customer.orders.count() > 0.40:
            score -= 30
            signals["abusive_refunds"] = True
            recommendations.append("Taux de remboursement abusif — flag manuel")

    final = max(0, min(100, int(score)))
    return TrustScore(
        score=final,
        risk_level=_risk_level(final),
        signals=signals,
        recommendations=recommendations,
    )


# ============================================================
# 4. Order Risk Score
# ============================================================
def order_risk_score(order) -> TrustScore:
    signals: dict = {}
    recommendations: list[str] = []
    score = 100.0

    # Quantité × prix : commande géante depuis nouveau client
    customer_score = customer_trust_score(order.customer)
    if customer_score.score < 60:
        score -= 30
        signals["low_customer_trust"] = customer_score.score
        recommendations.append("Client à risque — pré-paiement intégral recommandé")

    # Adresse de livraison incomplète
    if not (order.delivery_address or {}).get("address"):
        score -= 10
        signals["incomplete_address"] = True

    # Délai demandé déraisonnablement court (Express < 4h sans paiement immédiat)
    if order.expected_delivery_at and order.paid_at:
        delta_hours = (order.expected_delivery_at - order.paid_at).total_seconds() / 3600
        if delta_hours < 4 and Decimal(order.total_incl_tax or 0) < Decimal("50000"):
            score -= 15
            signals["unrealistic_lead_time"] = round(delta_hours, 1)

    # Multiples commandes simultanées même client (>5 en 1h)
    since = timezone.now() - timedelta(hours=1)
    burst_count = order.customer.orders.filter(created_at__gte=since).count()
    if burst_count > 5:
        score -= 25
        signals["order_burst_1h"] = burst_count
        recommendations.append("Burst de commandes — comportement bot suspect")

    final = max(0, min(100, int(score)))
    return TrustScore(
        score=final,
        risk_level=_risk_level(final),
        signals=signals,
        recommendations=recommendations,
    )


# ============================================================
# Console antifraude — agrégation des alertes critiques
# ============================================================
def fraud_console_summary(days: int = 7) -> dict:
    """Vue admin agrégée des alertes en cours."""
    from apps.orders.models import Order
    from apps.payments.models import Payment
    from apps.printers.models import PrinterProfile

    since = timezone.now() - timedelta(days=days)

    critical_printers = []
    for p in PrinterProfile.objects.filter(status__in=["active", "probation"])[:200]:
        ts = printer_trust_score(p)
        if ts.score < 60:
            critical_printers.append({
                "id": str(p.id),
                "trade_name": p.trade_name,
                "score": ts.score,
                "risk": ts.risk_level,
                "signals": ts.signals,
            })

    critical_payments = []
    for pay in Payment.objects.filter(created_at__gte=since, status__in=["pending", "captured"])[:200]:
        ts = payment_risk_score(pay)
        if ts.score < 60:
            critical_payments.append({
                "reference": pay.reference,
                "amount": float(pay.amount or 0),
                "provider": pay.provider,
                "score": ts.score,
                "risk": ts.risk_level,
                "signals": ts.signals,
            })

    return {
        "period_days": days,
        "critical_printers_count": len(critical_printers),
        "critical_printers": critical_printers[:20],
        "critical_payments_count": len(critical_payments),
        "critical_payments": critical_payments[:20],
        "generated_at": timezone.now().isoformat(),
    }
