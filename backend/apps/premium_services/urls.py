from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    OrderServiceViewSet,
    PremiumServiceViewSet,
    PricingViewSet,
    ServiceCategoryViewSet,
)

router = DefaultRouter()
router.register("categories", ServiceCategoryViewSet, basename="svc-category")
router.register("services", PremiumServiceViewSet, basename="svc-service")
router.register("order-services", OrderServiceViewSet, basename="svc-order-service")

urlpatterns = [
    path("price/", PricingViewSet.as_view({"post": "create"}), name="svc-price"),
    *router.urls,
]
