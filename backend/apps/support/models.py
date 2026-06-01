"""Tickets support."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Ticket(BaseModel):
    class Status(models.TextChoices):
        OPEN = "open", _("Ouvert")
        ASSIGNED = "assigned", _("Assigné")
        WAITING_USER = "waiting_user", _("Attente utilisateur")
        WAITING_INTERNAL = "waiting_internal", _("Attente interne")
        RESOLVED = "resolved", _("Résolu")
        CLOSED = "closed", _("Fermé")

    class Priority(models.TextChoices):
        LOW = "low", _("Faible")
        NORMAL = "normal", _("Normal")
        HIGH = "high", _("Élevée")
        URGENT = "urgent", _("Urgent")

    reference = models.CharField(max_length=24, unique=True)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="tickets",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="assigned_tickets",
    )
    order = models.ForeignKey(
        "orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="tickets",
    )
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=64, blank=True)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.NORMAL)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.OPEN)
    sla_due_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)


class TicketMessage(BaseModel):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    body = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    is_internal = models.BooleanField(default=False, help_text="Note interne non visible client")
