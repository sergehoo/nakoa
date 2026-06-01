"""Présigned URLs et gestion des uploads chunked."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class PresignedUploadRequest(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="presigned_uploads",
    )
    object_key = models.CharField(max_length=255)
    bucket = models.CharField(max_length=120)
    upload_url = models.URLField()
    expires_at = models.DateTimeField()
    file_size = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=120, blank=True)
    is_completed = models.BooleanField(default=False)
