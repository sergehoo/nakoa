from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related("actor")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ["action", "resource_type", "actor"]
    search_fields = ["resource_id", "action"]
