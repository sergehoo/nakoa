from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.documents.models import Document

from .models import AICallLog, BATAnalysis, PromptTemplate
from .serializers import AICallLogSerializer, BATAnalysisSerializer, PromptTemplateSerializer
from .tasks import analyze_bat_task


class BATAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BATAnalysisSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["order", "status"]

    def get_queryset(self):
        user = self.request.user
        qs = BATAnalysis.objects.all()
        if user.is_staff:
            return qs
        return qs.filter(order__customer=user)

    @action(detail=False, methods=["post"], url_path="run")
    def run(self, request):
        order_id = request.data.get("order_id")
        document_id = request.data.get("document_id")
        if not order_id or not document_id:
            return Response({"detail": "order_id et document_id requis"}, status=400)
        async_result = analyze_bat_task.delay(order_id, document_id)
        return Response({"task_id": async_result.id, "status": "queued"})


class AICallLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AICallLog.objects.all()
    serializer_class = AICallLogSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ["provider", "feature", "success"]


class PromptTemplateViewSet(viewsets.ModelViewSet):
    queryset = PromptTemplate.objects.all()
    serializer_class = PromptTemplateSerializer
    permission_classes = [IsAdminUser]
