"""Pipeline commercial (acquisition imprimeurs + grands comptes clients)."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country


class Lead(BaseModel):
    class Kind(models.TextChoices):
        PRINTER = "printer", _("Imprimeur prospect")
        CUSTOMER = "customer", _("Client B2B prospect")
        PARTNER = "partner", _("Partenaire")

    class Stage(models.TextChoices):
        NEW = "new", _("Nouveau")
        CONTACTED = "contacted", _("Contacté")
        QUALIFIED = "qualified", _("Qualifié")
        DEMO = "demo", _("Démo")
        NEGOTIATION = "negotiation", _("Négociation")
        WON = "won", _("Gagné")
        LOST = "lost", _("Perdu")

    kind = models.CharField(max_length=16, choices=Kind.choices)
    stage = models.CharField(max_length=16, choices=Stage.choices, default=Stage.NEW)
    full_name = models.CharField(max_length=160)
    company = models.CharField(max_length=160, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    city = models.CharField(max_length=120, blank=True)
    source = models.CharField(max_length=80, blank=True)
    estimated_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    expected_close_date = models.DateField(null=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="crm_leads",
    )
    tags = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)


class CRMActivity(BaseModel):
    class Kind(models.TextChoices):
        CALL = "call", _("Appel")
        EMAIL = "email", _("Email")
        MEETING = "meeting", _("Rendez-vous")
        TASK = "task", _("Tâche")
        NOTE = "note", _("Note")

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="activities")
    kind = models.CharField(max_length=16, choices=Kind.choices)
    subject = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="crm_activities",
    )
