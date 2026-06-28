from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    CouponCodeViewSet,
    CouponRedemptionViewSet,
    CouponValidateViewSet,
    PromotionCampaignViewSet,
)

router = DefaultRouter()
router.register("campaigns", PromotionCampaignViewSet, basename="promo-campaign")
router.register("codes", CouponCodeViewSet, basename="promo-code")
router.register("redemptions", CouponRedemptionViewSet, basename="promo-redemption")

urlpatterns = [
    # Customer
    path("validate/", CouponValidateViewSet.as_view({"post": "create"}),
         name="promo-validate"),

    *router.urls,
]
