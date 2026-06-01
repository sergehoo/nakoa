from rest_framework.routers import DefaultRouter
from .viewsets import DeliveryAssignmentViewSet, DeliveryProofViewSet

router = DefaultRouter()
router.register("assignments", DeliveryAssignmentViewSet, basename="delivery-assignment")
router.register("proofs", DeliveryProofViewSet, basename="delivery-proof")
urlpatterns = router.urls
