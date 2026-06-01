from rest_framework.routers import DefaultRouter

from .viewsets import MatchingRunViewSet

router = DefaultRouter()
router.register("runs", MatchingRunViewSet, basename="matching-run")
urlpatterns = router.urls
