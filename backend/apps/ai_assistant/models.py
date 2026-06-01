"""Conversations avec l'assistant IA selon le rôle."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class AssistantPersona(models.TextChoices):
    CUSTOMER = "customer", _("Assistant client")
    PRINTER = "printer", _("Assistant imprimeur")
    ADMIN = "admin", _("Assistant admin")


class AssistantConversation(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assistant_conversations",
    )
    persona = models.CharField(max_length=16, choices=AssistantPersona.choices, default=AssistantPersona.CUSTOMER)
    title = models.CharField(max_length=255, blank=True)
    context = models.JSONField(default=dict, blank=True)
    is_archived = models.BooleanField(default=False)


class AssistantMessage(BaseModel):
    class Role(models.TextChoices):
        USER = "user", _("Utilisateur")
        ASSISTANT = "assistant", _("Assistant")
        SYSTEM = "system", _("Système")
        TOOL = "tool", _("Outil")

    conversation = models.ForeignKey(
        AssistantConversation, on_delete=models.CASCADE, related_name="messages",
    )
    role = models.CharField(max_length=16, choices=Role.choices)
    content = models.TextField()
    tool_calls = models.JSONField(default=list, blank=True)
    tokens = models.PositiveIntegerField(default=0)
    cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "created_at"])]
