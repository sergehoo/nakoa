from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_finance import (
    cac_kpi,
    customer_ltv,
    order_margin,
    platform_profitability,
    printer_profitability,
    saas_kpis,
)
from .views_public import landing_stats
from .views_sla import (
    my_sla,
    printer_sla,
    regional_sla,
    sla_breaches_now,
)
from .viewsets import AnalyticsEventViewSet

router = DefaultRouter()
router.register("events", AnalyticsEventViewSet, basename="analytics-event")

urlpatterns = [
    # Public — landing page
    path("public/stats/", landing_stats, name="public-landing-stats"),

    # Financial intelligence
    path("finance/orders/<uuid:order_id>/margin/", order_margin, name="order-margin"),
    path("finance/printers/me/", printer_profitability, name="printer-profitability-me"),
    path("finance/printers/<uuid:printer_id>/", printer_profitability, name="printer-profitability"),
    path("finance/platform/", platform_profitability, name="platform-profitability"),
    path("finance/cac/", cac_kpi, name="cac-kpi"),
    path("finance/customers/me/ltv/", customer_ltv, name="customer-ltv-me"),
    path("finance/customers/<uuid:customer_id>/ltv/", customer_ltv, name="customer-ltv"),
    path("finance/saas-kpis/", saas_kpis, name="saas-kpis"),

    # SLA Engine
    path("sla/me/", my_sla, name="sla-me"),
    path("sla/printers/<uuid:printer_id>/", printer_sla, name="sla-printer"),
    path("sla/regional/", regional_sla, name="sla-regional"),
    path("sla/breaches/", sla_breaches_now, name="sla-breaches"),

    *router.urls,
]
