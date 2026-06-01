"""Audit des appels IA + analyses BAT + prompts versionnés."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class PromptTemplate(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    system_prompt = models.TextField()
    user_template = models.TextField(blank=True)
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)


class AICallLog(BaseModel):
    """Audit complet d'un appel IA pour traçabilité, coût et qualité."""

    provider = models.CharField(max_length=24)
    model = models.CharField(max_length=64)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="ai_calls",
    )
    feature = models.CharField(max_length=64, db_index=True)
    prompt_template = models.ForeignKey(PromptTemplate, null=True, blank=True, on_delete=models.SET_NULL)
    request_payload = models.JSONField(default=dict, blank=True)
    response_payload = models.JSONField(default=dict, blank=True)
    tokens_in = models.PositiveIntegerField(default=0)
    tokens_out = models.PositiveIntegerField(default=0)
    cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=Decimal("0"))
    latency_ms = models.PositiveIntegerField(default=0)
    success = models.BooleanField(default=True)
    error = models.TextField(blank=True)


class BATAnalysis(BaseModel):
    """Résultat d'analyse d'un BAT par le moteur IA."""

    class Status(models.TextChoices):
        PENDING = "pending", _("En cours")
        DONE = "done", _("Terminée")
        FAILED = "failed", _("Échouée")

    order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="bat_analyses",
    )
    document = models.ForeignKey(
        "documents.Document", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="bat_analyses",
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)

    detected_dpi = models.PositiveIntegerField(null=True, blank=True)
    color_space = models.CharField(max_length=24, blank=True)
    has_bleeds = models.BooleanField(null=True, blank=True)
    bleeds_mm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    has_safety_margins = models.BooleanField(null=True, blank=True)
    fonts_embedded = models.BooleanField(null=True, blank=True)
    pages = models.PositiveIntegerField(default=1)
    issues = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    overall_score = models.PositiveSmallIntegerField(default=0)
    preview_url = models.URLField(blank=True)
    summary = models.TextField(blank=True)
