from rest_framework.routers import DefaultRouter

from .viewsets import MeViewSet, UserAddressViewSet, UserDeviceViewSet

router = DefaultRouter()
router.register("me", MeViewSet, basename="me")
router.register("addresses", UserAddressViewSet, basename="address")
router.register("devices", UserDeviceViewSet, basename="device")

urlpatterns = router.urls
