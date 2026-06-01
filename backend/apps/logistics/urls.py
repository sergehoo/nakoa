from rest_framework.routers import DefaultRouter
from .viewsets import CarrierViewSet, RouteViewSet, ShipmentViewSet

router = DefaultRouter()
router.register("carriers", CarrierViewSet, basename="carrier")
router.register("shipments", ShipmentViewSet, basename="shipment")
router.register("routes", RouteViewSet, basename="route")
urlpatterns = router.urls
