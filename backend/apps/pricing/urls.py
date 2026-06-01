from rest_framework.routers import DefaultRouter

from .viewsets import (
    PriceGridViewSet,
    PriceModifierViewSet,
    PriceTierViewSet,
    PromoCodeViewSet,
)

router = DefaultRouter()
router.register("grids", PriceGridViewSet, basename="price-grid")
router.register("tiers", PriceTierViewSet, basename="price-tier")
router.register("modifiers", PriceModifierViewSet, basename="price-modifier")
router.register("promos", PromoCodeViewSet, basename="promo")
urlpatterns = router.urls
