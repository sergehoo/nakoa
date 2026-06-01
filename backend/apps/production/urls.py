from rest_framework.routers import DefaultRouter

from .viewsets import (
    ProductionIncidentViewSet,
    ProductionJobViewSet,
    ProductionPhotoViewSet,
    ProductionStepViewSet,
)

router = DefaultRouter()
router.register("jobs", ProductionJobViewSet, basename="production-job")
router.register("steps", ProductionStepViewSet, basename="production-step")
router.register("incidents", ProductionIncidentViewSet, basename="production-incident")
router.register("photos", ProductionPhotoViewSet, basename="production-photo")
urlpatterns = router.urls
