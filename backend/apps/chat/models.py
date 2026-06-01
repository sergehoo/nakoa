"""Chat temps réel client ↔ imprimeur ↔ support."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Conversation(BaseModel):
    class Kind(models.TextChoices):
        ORDER = "order", _("Commande")
        QUOTE = "quote", _("Devis")
        SUPPORT = "support", _("Support")
        DIRECT = "direct", _("Direct")

    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.ORDER)
    subject = models.CharField(max_length=255, blank=True)
    order = models.ForeignKey(
        "orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="conversations",
    )
    quote_request = models.ForeignKey(
        "quote_requests.QuoteRequest", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="conversations",
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="ConversationMember", related_name="conversations",
    )
    last_message_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)


class ConversationMember(BaseModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=32, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_muted = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["conversation", "user"], name="uq_conv_user"),
        ]


class Message(BaseModel):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    body = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_system = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["conversation", "created_at"])]
        ordering = ["created_at"]
