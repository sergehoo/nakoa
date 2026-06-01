"""Trace des décisions de matching pour auditabilité et ML."""

from __future__ import annotations

from django.db import models

from apps.core.models import BaseModel


class MatchingRun(BaseModel):
    quote_request = models.OneToOneField(
        "quote_requests.QuoteRequest", on_delete=models.CASCADE, related_name="matching_run",
    )
    candidates_count = models.PositiveIntegerField(default=0)
    weights = models.JSONField(default=dict, blank=True)
    raw_scores = models.JSONField(default=list, blank=True)
    selected_offer_ids = models.JSONField(default=list, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)
    algorithm_version = models.CharField(max_length=32, default="v1")
