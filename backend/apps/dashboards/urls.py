from django.urls import path

from .views import admin_dashboard, customer_dashboard, printer_dashboard
from .views_ops import ops_ai_monitoring, ops_map, ops_overview, war_room

urlpatterns = [
    path("admin/", admin_dashboard, name="dashboard-admin"),
    path("printer/", printer_dashboard, name="dashboard-printer"),
    path("customer/", customer_dashboard, name="dashboard-customer"),

    # Operations Center
    path("ops/overview/", ops_overview, name="ops-overview"),
    path("ops/map/", ops_map, name="ops-map"),
    path("ops/ai-monitoring/", ops_ai_monitoring, name="ops-ai-monitoring"),
    path("ops/war-room/", war_room, name="war-room"),
]
