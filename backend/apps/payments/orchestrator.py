"""PaymentOrchestrator — sélection automatique du provider optimal selon contexte.

Règles :
1. Si client a déjà payé en succès récemment → préférer le même provider (mémorisé)
2. Mobile Money (Wave, OM, MTN, Moov) pour montants < 500 000 XOF en zone UEMOA
3. CinetPay (multi-méthodes) pour montants moyens 500k-5M
4. Stripe pour clients hors zone CFA ou montants > 5M XOF
5. Filtrage par devise supportée
6. Fallback : CinetPay (couverture la plus large)
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ProviderCapability:
    code: str
    supported_currencies: frozenset[str]
    supported_countries: frozenset[str]
    min_amount: Decimal
    max_amount: Decimal
    fees_pct: Decimal
    needs_phone: bool = False
    settlement_days: int = 1


PROVIDER_CAPABILITIES = [
    ProviderCapability(
        code="wave",
        supported_currencies=frozenset(["XOF"]),
        supported_countries=frozenset(["CI", "SN"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("10000000"),
        fees_pct=Decimal("1.0"),
        needs_phone=True,
        settlement_days=1,
    ),
    ProviderCapability(
        code="orange_money",
        supported_currencies=frozenset(["XOF"]),
        supported_countries=frozenset(["CI", "SN", "ML", "BF", "NE"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("3000000"),
        fees_pct=Decimal("1.5"),
        needs_phone=True,
        settlement_days=2,
    ),
    ProviderCapability(
        code="mtn_momo",
        supported_currencies=frozenset(["XOF", "XAF", "GHS", "NGN"]),
        supported_countries=frozenset(["CI", "BJ", "CM", "GH", "NG"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("3000000"),
        fees_pct=Decimal("1.5"),
        needs_phone=True,
        settlement_days=2,
    ),
    ProviderCapability(
        code="moov_money",
        supported_currencies=frozenset(["XOF"]),
        supported_countries=frozenset(["CI", "BJ", "TG", "BF"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("2000000"),
        fees_pct=Decimal("1.5"),
        needs_phone=True,
        settlement_days=2,
    ),
    ProviderCapability(
        code="cinetpay",
        supported_currencies=frozenset(["XOF", "XAF", "EUR", "USD"]),
        supported_countries=frozenset(["CI", "SN", "BJ", "TG", "BF", "ML", "CM"]),
        min_amount=Decimal("500"),
        max_amount=Decimal("50000000"),
        fees_pct=Decimal("2.5"),
        settlement_days=1,
    ),
    ProviderCapability(
        code="paystack",
        supported_currencies=frozenset(["NGN", "GHS", "ZAR", "USD"]),
        supported_countries=frozenset(["NG", "GH", "ZA"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("50000000"),
        fees_pct=Decimal("1.5"),
        settlement_days=1,
    ),
    ProviderCapability(
        code="flutterwave",
        supported_currencies=frozenset(["XOF", "NGN", "GHS", "EUR", "USD"]),
        supported_countries=frozenset(["NG", "GH", "CI", "SN", "BJ", "CM", "ZA", "KE"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("50000000"),
        fees_pct=Decimal("2.0"),
        settlement_days=2,
    ),
    ProviderCapability(
        code="stripe",
        supported_currencies=frozenset(["EUR", "USD", "GBP", "XOF"]),
        supported_countries=frozenset(["FR", "US", "GB", "DE", "ES", "IT", "BE", "CH"]),
        min_amount=Decimal("100"),
        max_amount=Decimal("999999999"),
        fees_pct=Decimal("2.9"),
        settlement_days=2,
    ),
]


@dataclass
class PaymentContext:
    amount: Decimal
    currency: str
    customer_country: str
    customer_phone: str | None = None
    preferred_provider: str | None = None  # ex: dernier paiement réussi


@dataclass
class ProviderRecommendation:
    code: str
    reason: str
    fees_pct: Decimal
    estimated_fees: Decimal
    settlement_days: int


def recommend_providers(ctx: PaymentContext, limit: int = 3) -> list[ProviderRecommendation]:
    """Retourne les providers ordonnés par pertinence pour ce contexte."""
    eligible = []
    for p in PROVIDER_CAPABILITIES:
        if ctx.currency not in p.supported_currencies:
            continue
        if ctx.customer_country not in p.supported_countries:
            continue
        if ctx.amount < p.min_amount or ctx.amount > p.max_amount:
            continue
        if p.needs_phone and not ctx.customer_phone:
            continue
        eligible.append(p)

    if not eligible:
        return []

    # Score : favoriser frais bas + settlement rapide + preferred user
    def score(p: ProviderCapability) -> float:
        s = 100.0
        s -= float(p.fees_pct) * 10  # pénalité frais
        s -= p.settlement_days * 3   # pénalité délai
        if ctx.preferred_provider == p.code:
            s += 20  # bonus mémorisation
        # Bonus catégorie : mobile money en zone CFA pour petits montants
        if ctx.amount < Decimal("500000") and p.needs_phone:
            s += 15
        # Bonus généralité : CinetPay pour montants moyens
        if Decimal("500000") <= ctx.amount <= Decimal("5000000") and p.code == "cinetpay":
            s += 10
        return s

    eligible.sort(key=lambda p: -score(p))
    return [
        ProviderRecommendation(
            code=p.code,
            reason=_explain_choice(p, ctx),
            fees_pct=p.fees_pct,
            estimated_fees=(ctx.amount * p.fees_pct / Decimal("100")).quantize(Decimal("0.01")),
            settlement_days=p.settlement_days,
        )
        for p in eligible[:limit]
    ]


def _explain_choice(p: ProviderCapability, ctx: PaymentContext) -> str:
    if ctx.preferred_provider == p.code:
        return "Utilisé avec succès lors de votre dernier paiement"
    if p.needs_phone and ctx.amount < Decimal("500000"):
        return f"Mobile Money rapide, frais {p.fees_pct} % seulement"
    if p.code == "cinetpay":
        return "Couverture la plus large (carte + Mobile Money)"
    if p.code == "stripe":
        return "Paiement carte international sécurisé"
    return f"Frais {p.fees_pct} %, encaissement J+{p.settlement_days}"


def auto_select_provider(ctx: PaymentContext) -> str | None:
    """Retourne directement le meilleur provider (pour API silencieuse)."""
    recos = recommend_providers(ctx, limit=1)
    return recos[0].code if recos else None
