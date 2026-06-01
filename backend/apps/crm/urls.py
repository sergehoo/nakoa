from rest_framework.routers import DefaultRouter
from .viewsets import CRMActivityViewSet, LeadViewSet

router = DefaultRouter()
router.register("leads", LeadViewSet, basename="lead")
router.register("activities", CRMActivityViewSet, basename="crm-activity")
urlpatterns = router.urls
