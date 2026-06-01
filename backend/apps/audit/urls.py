from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_fraud import (
    console_summary,
    customer_score,
    order_score,
    payment_score,
    printer_score,
)
from .viewsets import AuditLogViewSet

router = DefaultRouter()
router.register("logs", AuditLogViewSet, basename="audit-log")

urlpatterns = [
    # Fraud Engine
    path("fraud/printers/<uuid:printer_id>/", printer_score, name="fraud-printer"),
    path("fraud/payments/<uuid:payment_id>/", payment_score, name="fraud-payment"),
    path("fraud/orders/<uuid:order_id>/", order_score, name="fraud-order"),
    path("fraud/customers/<uuid:customer_id>/", customer_score, name="fraud-customer"),
    path("fraud/console/", console_summary, name="fraud-console"),

    *router.urls,
]
