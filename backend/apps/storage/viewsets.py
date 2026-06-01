from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PresignedUploadRequest
from .serializers import PresignedRequestSerializer, PresignedUploadSerializer
from .services import create_presigned_put


class PresignedUploadViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="request")
    def request_upload(self, request):
        s = PresignedRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        obj = create_presigned_put(
            user=request.user,
            filename=s.validated_data["filename"],
            content_type=s.validated_data["content_type"],
            prefix=s.validated_data.get("prefix", "uploads"),
        )
        return Response(PresignedUploadSerializer(obj).data, status=201)
