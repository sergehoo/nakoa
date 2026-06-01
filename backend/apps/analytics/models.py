"""Événements analytics — collecte fine pour BI et ML."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class AnalyticsEvent(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="analytics_events",
    )
    session_id = models.CharField(max_length=64, blank=True, db_index=True)
    event_type = models.CharField(max_length=64, db_index=True)
    properties = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField(db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["event_type", "occurred_at"]),
            models.Index(fields=["user", "occurred_at"]),
        ]
