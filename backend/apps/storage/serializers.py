from rest_framework import serializers
from .models import PresignedUploadRequest


class PresignedUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PresignedUploadRequest
        fields = "__all__"
        read_only_fields = ["id", "user", "upload_url", "expires_at", "created_at"]


class PresignedRequestSerializer(serializers.Serializer):
    filename = serializers.CharField()
    content_type = serializers.CharField()
    prefix = serializers.CharField(required=False, default="uploads")
