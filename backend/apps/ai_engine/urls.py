from rest_framework.routers import DefaultRouter
from .viewsets import AICallLogViewSet, BATAnalysisViewSet, PromptTemplateViewSet

router = DefaultRouter()
router.register("bat-analyses", BATAnalysisViewSet, basename="bat-analysis")
router.register("call-logs", AICallLogViewSet, basename="ai-call-log")
router.register("prompts", PromptTemplateViewSet, basename="prompt-template")
urlpatterns = router.urls
