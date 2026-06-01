from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from .models import Workflow, WorkflowExecution
from .serializers import WorkflowExecutionSerializer, WorkflowSerializer


class WorkflowViewSet(viewsets.ModelViewSet):
    queryset = Workflow.objects.all()
    serializer_class = WorkflowSerializer
    permission_classes = [IsAdminUser]


class WorkflowExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowExecution.objects.all()
    serializer_class = WorkflowExecutionSerializer
    permission_classes = [IsAdminUser]
