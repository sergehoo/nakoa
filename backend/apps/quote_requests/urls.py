from rest_framework.routers import DefaultRouter

from .viewsets import QuoteRequestViewSet

router = DefaultRouter()
router.register("", QuoteRequestViewSet, basename="quote-request")
urlpatterns = router.urls
