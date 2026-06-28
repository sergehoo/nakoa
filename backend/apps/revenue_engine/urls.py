"""URLs du Revenue Engine — montées sous /api/v1/revenue/."""

from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    CommissionPreviewViewSet,
    CommissionRuleViewSet,
    MonetizationConfigViewSet,
    RevenueDashboardViewSet,
    RevenueEntryViewSet,
    RevenueSourceViewSet,
    RuleAuditLogViewSet,
    RuleEvaluationLogViewSet,
)

router = DefaultRouter()
router.register("sources", RevenueSourceViewSet, basename="re-source")
router.register("commission-rules", CommissionRuleViewSet, basename="re-rule")
router.register("audit", RuleAuditLogViewSet, basename="re-audit")
router.register("evaluations", RuleEvaluationLogViewSet, basename="re-evaluation")
router.register("entries", RevenueEntryViewSet, basename="re-entry")

urlpatterns = [
    # Singleton config
    path("config/", MonetizationConfigViewSet.as_view({"get": "list"}),
         name="re-config-detail"),
    path("config/update/", MonetizationConfigViewSet.as_view({"patch": "partial_update"}),
         name="re-config-update"),

    # Dashboard
    path("dashboard/", RevenueDashboardViewSet.as_view({"get": "list"}),
         name="re-dashboard"),

    # Preview commission sur une commande
    path("preview-commission/", CommissionPreviewViewSet.as_view({"post": "create"}),
         name="re-preview-commission"),

    *router.urls,
]
