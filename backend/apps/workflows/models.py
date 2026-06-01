"""Moteur de workflows configurables : règles métier, automatisations."""

from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Workflow(BaseModel):
    code = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    trigger_event = models.CharField(max_length=80, help_text="ex: order.paid, kyc.approved")
    conditions = models.JSONField(default=list, blank=True)
    actions = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)


class WorkflowExecution(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", _("En attente")
        RUNNING = "running", _("En cours")
        SUCCESS = "success", _("Succès")
        FAILED = "failed", _("Échec")

    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="executions")
    trigger_payload = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    error = models.TextField(blank=True)
