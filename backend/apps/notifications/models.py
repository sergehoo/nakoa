"""Notifications multi-canal (email, SMS, push, WhatsApp, in-app)."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Channel(models.TextChoices):
    IN_APP = "in_app", _("In-app")
    EMAIL = "email", _("Email")
    SMS = "sms", _("SMS")
    PUSH = "push", _("Push mobile")
    WHATSAPP = "whatsapp", _("WhatsApp")


class NotificationStatus(models.TextChoices):
    PENDING = "pending", _("En attente")
    SENT = "sent", _("Envoyée")
    DELIVERED = "delivered", _("Délivrée")
    READ = "read", _("Lue")
    FAILED = "failed", _("Échouée")


class NotificationTemplate(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    label = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    default_channels = models.JSONField(default=list, blank=True)
    subject_template = models.CharField(max_length=255, blank=True)
    body_template = models.TextField(blank=True)
    sms_template = models.CharField(max_length=255, blank=True)
    push_title_template = models.CharField(max_length=120, blank=True)
    push_body_template = models.CharField(max_length=255, blank=True)


class Notification(BaseModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications",
    )
    channel = models.CharField(max_length=16, choices=Channel.choices)
    template_code = models.CharField(max_length=80, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=NotificationStatus.choices, default=NotificationStatus.PENDING)
    error = models.CharField(max_length=255, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    external_id = models.CharField(max_length=160, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["recipient", "status", "created_at"]),
            models.Index(fields=["channel", "status"]),
        ]
