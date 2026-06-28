from rest_framework.routers import DefaultRouter

from .viewsets import AdminSubscriptionViewSet, PlanViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register("plans", PlanViewSet, basename="plan")
router.register("admin", AdminSubscriptionViewSet, basename="admin-subscription")
router.register("", SubscriptionViewSet, basename="subscription")

urlpatterns = router.urls
