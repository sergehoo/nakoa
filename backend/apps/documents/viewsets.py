from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["kind", "related_resource_type", "related_resource_id"]

    def perform_create(self, serializer):
        f = serializer.validated_data.get("file")
        serializer.save(
            uploaded_by=self.request.user,
            file_name=getattr(f, "name", "")[:255],
            size_bytes=getattr(f, "size", 0),
            mime_type=getattr(f, "content_type", "")[:120] if hasattr(f, "content_type") else "",
        )
