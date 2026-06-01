"""KYC client + KYB imprimeur — progressifs, validation manuelle pour KYB."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class KYCSubmissionStatus(models.TextChoices):
    DRAFT = "draft", _("Brouillon")
    SUBMITTED = "submitted", _("Soumis")
    UNDER_REVIEW = "under_review", _("En revue")
    APPROVED = "approved", _("Approuvé")
    REJECTED = "rejected", _("Rejeté")
    NEEDS_INFO = "needs_info", _("Complément demandé")


class KYCSubmission(BaseModel):
    class Type(models.TextChoices):
        CUSTOMER = "customer", _("KYC client")
        BUSINESS = "business", _("KYB imprimeur/entreprise")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="kyc_submissions",
    )
    type = models.CharField(max_length=16, choices=Type.choices)
    status = models.CharField(max_length=16, choices=KYCSubmissionStatus.choices, default=KYCSubmissionStatus.DRAFT)
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="reviewed_kyc",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)
    decision_note = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)


class KYCDocument(BaseModel):
    class Kind(models.TextChoices):
        ID_CARD = "id_card", _("CNI / passeport")
        SELFIE = "selfie", _("Selfie liveness")
        RCCM = "rccm", _("RCCM")
        TAX_CERT = "tax_cert", _("Attestation fiscale")
        BANK_RIB = "bank_rib", _("RIB")
        PROOF_ADDRESS = "proof_address", _("Justificatif d'adresse")
        WORKSHOP_PHOTO = "workshop_photo", _("Photo atelier")
        OTHER = "other", _("Autre")

    submission = models.ForeignKey(KYCSubmission, on_delete=models.CASCADE, related_name="documents")
    kind = models.CharField(max_length=24, choices=Kind.choices)
    file = models.FileField(upload_to="kyc/")
    extracted_data = models.JSONField(default=dict, blank=True)
    is_validated = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
