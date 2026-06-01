"""Stockage générique de documents : BAT, factures, certificats, exports."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Document(BaseModel):
    class Kind(models.TextChoices):
        BAT = "bat", _("BAT")
        INVOICE = "invoice", _("Facture")
        QUOTE_PDF = "quote_pdf", _("Devis PDF")
        DELIVERY_NOTE = "delivery_note", _("Bon de livraison")
        KYC = "kyc", _("KYC")
        REPORT = "report", _("Rapport")
        CONTRACT = "contract", _("Contrat")
        OTHER = "other", _("Autre")

    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.OTHER)
    file = models.FileField(upload_to="documents/")
    file_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=120, blank=True)
    size_bytes = models.BigIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="uploaded_documents",
    )
    is_signed = models.BooleanField(default=False)
    signature_payload = models.JSONField(default=dict, blank=True)
    related_resource_type = models.CharField(max_length=80, blank=True)
    related_resource_id = models.CharField(max_length=80, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["kind", "related_resource_type", "related_resource_id"]),
        ]
