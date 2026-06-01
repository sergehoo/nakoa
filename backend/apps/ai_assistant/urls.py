from rest_framework.routers import DefaultRouter
from .viewsets import AssistantConversationViewSet

router = DefaultRouter()
router.register("conversations", AssistantConversationViewSet, basename="assistant-conversation")
urlpatterns = router.urls
