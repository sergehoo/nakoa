from rest_framework.routers import DefaultRouter
from .viewsets import WorkflowExecutionViewSet, WorkflowViewSet

router = DefaultRouter()
router.register("definitions", WorkflowViewSet, basename="workflow")
router.register("executions", WorkflowExecutionViewSet, basename="workflow-execution")
urlpatterns = router.urls
