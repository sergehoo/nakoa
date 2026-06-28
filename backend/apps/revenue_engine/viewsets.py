"""ViewSets DRF du Revenue Engine — Super Admin BO."""

from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import TruncDay
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    CommissionRule,
    MonetizationConfig,
    RevenueEntry,
    RevenueSource,
    RuleAuditLog,
    RuleEvaluationLog,
    RuleVersion,
)
from .permissions import IsAdminReadOnlyOrSuperAdmin, IsSuperAdmin
from .serializers import (
    CommissionRuleSerializer,
    MonetizationConfigSerializer,
    RevenueEntrySerializer,
    RevenueSourceSerializer,
    RuleAuditLogSerializer,
    RuleEvaluationLogSerializer,
    RuleVersionSerializer,
)
from .services import CommissionCalculator
from .services.rule_engine import RuleEngineError, evaluate_rule


# ============================================================
# Sources de revenu
# ============================================================
class RevenueSourceViewSet(viewsets.ModelViewSet):
    """CRUD des sources de revenu. Lecture admin, écriture super admin."""

    queryset = RevenueSource.objects.all()
    serializer_class = RevenueSourceSerializer
    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]
    lookup_field = "code"

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsSuperAdmin])
    def toggle(self, request, code=None):
        """Bascule rapide is_enabled."""
        source = self.get_object()
        before = source.is_enabled
        source.is_enabled = not source.is_enabled
        source.save(update_fields=["is_enabled", "updated_at"])

        RuleAuditLog.objects.create(
            actor=request.user,
            action=RuleAuditLog.Action.ENABLE if source.is_enabled else RuleAuditLog.Action.DISABLE,
            target_type="RevenueSource",
            target_id=str(source.id),
            target_label=source.label,
            before={"is_enabled": before},
            after={"is_enabled": source.is_enabled},
            reason=request.data.get("reason", "") if isinstance(request.data, dict) else "",
        )
        return Response(self.get_serializer(source).data)


# ============================================================
# Configuration globale (singleton)
# ============================================================
class MonetizationConfigViewSet(viewsets.ViewSet):
    """Singleton de configuration globale."""

    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]

    def list(self, request):
        cfg = MonetizationConfig.get_solo()
        return Response(MonetizationConfigSerializer(cfg).data)

    def partial_update(self, request, pk=None):
        if not IsSuperAdmin().has_permission(request, self):
            return Response({"detail": "Réservé au Super Admin."}, status=403)
        cfg = MonetizationConfig.get_solo()
        before = MonetizationConfigSerializer(cfg).data
        serializer = MonetizationConfigSerializer(cfg, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        RuleAuditLog.objects.create(
            actor=request.user,
            action=RuleAuditLog.Action.UPDATE,
            target_type="MonetizationConfig",
            target_id=str(cfg.id),
            target_label="Singleton",
            before=before,
            after=serializer.data,
            reason=request.data.get("reason", "") if isinstance(request.data, dict) else "",
        )
        return Response(serializer.data)


# ============================================================
# Règles de commission
# ============================================================
class CommissionRuleViewSet(viewsets.ModelViewSet):
    queryset = CommissionRule.objects.select_related("source").all()
    serializer_class = CommissionRuleSerializer
    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]

    def perform_create(self, serializer):
        rule = serializer.save()
        RuleAuditLog.objects.create(
            actor=self.request.user, action=RuleAuditLog.Action.CREATE,
            target_type="CommissionRule", target_id=str(rule.id),
            target_label=rule.name,
            before={}, after=serializer.data,
        )

    def perform_update(self, serializer):
        before = CommissionRuleSerializer(self.get_object()).data
        rule = serializer.save()
        RuleAuditLog.objects.create(
            actor=self.request.user, action=RuleAuditLog.Action.UPDATE,
            target_type="CommissionRule", target_id=str(rule.id),
            target_label=rule.name,
            before=before, after=serializer.data,
        )

    def perform_destroy(self, instance):
        before = CommissionRuleSerializer(instance).data
        RuleAuditLog.objects.create(
            actor=self.request.user, action=RuleAuditLog.Action.DELETE,
            target_type="CommissionRule", target_id=str(instance.id),
            target_label=instance.name,
            before=before, after={},
        )
        instance.delete()

    @action(detail=False, methods=["post"], url_path="validate-dsl",
            permission_classes=[IsAuthenticated, IsAdminReadOnlyOrSuperAdmin])
    def validate_dsl(self, request):
        """Valide un DSL JSON sans le sauver. Renvoie matched=True/False contre context."""
        rule = request.data.get("conditions", {})
        context = request.data.get("context", {})
        try:
            matched = evaluate_rule(rule, context)
        except RuleEngineError as exc:
            return Response({"ok": False, "error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"ok": True, "matched": bool(matched)})

    @action(detail=True, methods=["get"])
    def versions(self, request, pk=None):
        rule = self.get_object()
        qs = RuleVersion.objects.filter(rule=rule).order_by("-version_number")
        return Response(RuleVersionSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsSuperAdmin])
    def rollback(self, request, pk=None):
        """Restaure une version antérieure de la règle."""
        rule = self.get_object()
        version_number = request.data.get("version_number")
        try:
            version = RuleVersion.objects.get(rule=rule, version_number=version_number)
        except RuleVersion.DoesNotExist:
            return Response({"detail": "Version inconnue."}, status=404)

        before = CommissionRuleSerializer(rule).data
        snap = version.snapshot
        rule.name = snap.get("name", rule.name)
        rule.description = snap.get("description", rule.description)
        rule.is_active = snap.get("is_active", rule.is_active)
        rule.conditions = snap.get("conditions", rule.conditions)
        rule.calculation_type = snap.get("calculation_type", rule.calculation_type)
        rule.percentage = Decimal(str(snap.get("percentage", rule.percentage)))
        rule.fixed_amount = Decimal(str(snap.get("fixed_amount", rule.fixed_amount)))
        rule.min_commission = Decimal(str(snap.get("min_commission", rule.min_commission)))
        rule.max_commission = (
            Decimal(str(snap["max_commission"])) if snap.get("max_commission") is not None else None
        )
        rule.priority = snap.get("priority", rule.priority)
        rule.stacking = snap.get("stacking", rule.stacking)
        rule.save()

        RuleAuditLog.objects.create(
            actor=request.user, action=RuleAuditLog.Action.ROLLBACK,
            target_type="CommissionRule", target_id=str(rule.id), target_label=rule.name,
            before=before, after=CommissionRuleSerializer(rule).data,
            reason=f"Rollback vers v{version_number}",
        )
        return Response(CommissionRuleSerializer(rule).data)


# ============================================================
# Audit & evaluation logs (lecture seule)
# ============================================================
class RuleAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RuleAuditLog.objects.select_related("actor").all()
    serializer_class = RuleAuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]


class RuleEvaluationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RuleEvaluationLog.objects.select_related("rule").all()
    serializer_class = RuleEvaluationLogSerializer
    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        order_id = self.request.query_params.get("order_id")
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs


# ============================================================
# Dashboard
# ============================================================
class RevenueDashboardViewSet(viewsets.ViewSet):
    """Agrégats pour le BO de monétisation : KPIs, séries temporelles, splits."""

    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]

    def list(self, request):
        """Snapshot complet du dashboard."""
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        year_start = today_start.replace(month=1, day=1)

        def _sum(qs) -> str:
            return str(qs.aggregate(s=Sum("amount"))["s"] or Decimal("0"))

        revenue_qs = RevenueEntry.objects.all()
        kpis = {
            "today": _sum(revenue_qs.filter(occurred_at__gte=today_start)),
            "week": _sum(revenue_qs.filter(occurred_at__gte=week_start)),
            "month": _sum(revenue_qs.filter(occurred_at__gte=month_start)),
            "year": _sum(revenue_qs.filter(occurred_at__gte=year_start)),
            "all_time": _sum(revenue_qs),
        }

        # Répartition par source (30 derniers jours)
        since_30 = now - timedelta(days=30)
        by_source = (
            revenue_qs.filter(occurred_at__gte=since_30)
            .values("source__code", "source__label", "source__kind")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        by_source_payload = [
            {
                "code": row["source__code"],
                "label": row["source__label"],
                "kind": row["source__kind"],
                "total": str(row["total"] or Decimal("0")),
            }
            for row in by_source
        ]

        # Série temporelle (90 jours, par jour)
        since_90 = now - timedelta(days=90)
        series = (
            revenue_qs.filter(occurred_at__gte=since_90)
            .annotate(day=TruncDay("occurred_at"))
            .values("day")
            .annotate(total=Sum("amount"))
            .order_by("day")
        )
        series_payload = [
            {"day": row["day"].date().isoformat(), "total": str(row["total"] or Decimal("0"))}
            for row in series
        ]

        # Top pays (12 derniers mois)
        since_year = now - timedelta(days=365)
        by_country = (
            revenue_qs.filter(occurred_at__gte=since_year)
            .exclude(country="")
            .values("country")
            .annotate(total=Sum("amount"))
            .order_by("-total")[:10]
        )
        by_country_payload = [
            {"country": row["country"], "total": str(row["total"] or Decimal("0"))}
            for row in by_country
        ]

        # Status des sources
        sources_status = [
            {
                "code": s.code, "label": s.label, "kind": s.kind, "is_enabled": s.is_enabled,
            }
            for s in RevenueSource.objects.all().order_by("sort_order")
        ]

        return Response({
            "kpis": kpis,
            "by_source_30d": by_source_payload,
            "series_90d": series_payload,
            "by_country_365d": by_country_payload,
            "sources_status": sources_status,
        })


# ============================================================
# Entrées de revenu (lecture seule, pour drill-down)
# ============================================================
class RevenueEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RevenueEntry.objects.select_related("source").all()
    serializer_class = RevenueEntrySerializer
    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        kind = self.request.query_params.get("source_kind")
        if kind:
            qs = qs.filter(source__kind=kind)
        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(country=country)
        return qs


# ============================================================
# Preview commission (dry-run sur un order existant)
# ============================================================
class CommissionPreviewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, IsAdminReadOnlyOrSuperAdmin]

    def create(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"detail": "order_id requis."}, status=400)
        try:
            from apps.orders.models import Order
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:  # type: ignore[name-defined]
            return Response({"detail": "Commande introuvable."}, status=404)
        result = CommissionCalculator(dry_run=True).compute(order)
        return Response(result.to_dict())
