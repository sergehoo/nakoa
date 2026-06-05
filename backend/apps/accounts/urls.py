from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    MeViewSet,
    PaymentMethodViewSet,
    UserAddressViewSet,
    UserDeviceViewSet,
)

router = DefaultRouter()
router.register("addresses", UserAddressViewSet, basename="address")
router.register("devices", UserDeviceViewSet, basename="device")
router.register("payment-methods", PaymentMethodViewSet, basename="payment-method")

# /accounts/me/ → GET (profil) + PATCH/PUT (mise à jour)
# /accounts/me/preferences/ → GET + PATCH
# Routage manuel pour ne pas dépendre du pk DRF.
me_root = MeViewSet.as_view({
    "get": "list",
    "patch": "partial_update",
    "put": "update",
})
me_preferences = MeViewSet.as_view({"get": "preferences", "patch": "preferences"})

urlpatterns = [
    path("me/", me_root, name="me"),
    path("me/preferences/", me_preferences, name="me-preferences"),
    path("", include(router.urls)),
]
