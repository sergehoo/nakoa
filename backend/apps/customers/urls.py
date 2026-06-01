from rest_framework.routers import DefaultRouter

from .viewsets import (
    CustomerCompanyMemberViewSet,
    CustomerCompanyViewSet,
    CustomerProfileViewSet,
)

router = DefaultRouter()
router.register("profile", CustomerProfileViewSet, basename="customer-profile")
router.register("companies", CustomerCompanyViewSet, basename="customer-company")
router.register("company-members", CustomerCompanyMemberViewSet, basename="company-member")
urlpatterns = router.urls
