"""Service S3/MinIO — génération d'URLs signées."""

from __future__ import annotations

import secrets
from datetime import timedelta

import boto3
from django.conf import settings
from django.utils import timezone

from .models import PresignedUploadRequest


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL or None,
        aws_access_key_id=settings.AWS_S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_S3_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
    )


def create_presigned_put(*, user, filename: str, content_type: str, prefix: str = "uploads"):
    key = f"{prefix}/{user.id}/{secrets.token_hex(8)}-{filename}"
    client = _client()
    url = client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Key": key,
            "ContentType": content_type or "application/octet-stream",
        },
        ExpiresIn=3600,
        HttpMethod="PUT",
    )
    return PresignedUploadRequest.objects.create(
        user=user, object_key=key, bucket=settings.AWS_STORAGE_BUCKET_NAME,
        upload_url=url, expires_at=timezone.now() + timedelta(hours=1),
        content_type=content_type or "",
    )
