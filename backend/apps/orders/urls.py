from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_care import care_status, open_claim, resolve_claim
from .viewsets import OrderViewSet

router = DefaultRouter()
router.register("", OrderViewSet, basename="order")

urlpatterns = [
    path("<uuid:order_id>/care/status/", care_status, name="care-status"),
    path("<uuid:order_id>/care/claim/", open_claim, name="care-claim"),
    path("<uuid:order_id>/care/resolve/", resolve_claim, name="care-resolve"),
    *router.urls,
]
