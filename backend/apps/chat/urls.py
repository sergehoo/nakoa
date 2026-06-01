from rest_framework.routers import DefaultRouter
from .viewsets import ConversationViewSet

router = DefaultRouter()
router.register("conversations", ConversationViewSet, basename="conversation")
urlpatterns = router.urls
