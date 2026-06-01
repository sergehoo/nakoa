"""Organisations (équipes internes PrintHub ou entreprises clientes)."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country


class Organization(BaseModel):
    class Kind(models.TextChoices):
        INTERNAL = "internal", _("Interne PrintHub")
        CUSTOMER = "customer", _("Cliente entreprise")
        PRINTER = "printer", _("Imprimeur (équipe)")
        PARTNER = "partner", _("Partenaire")

    kind = models.CharField(max_length=16, choices=Kind.choices)
    name = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, unique=True)
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="OrganizationMember", related_name="organizations",
    )
    metadata = models.JSONField(default=dict, blank=True)


class OrganizationMember(BaseModel):
    class Role(models.TextChoices):
        OWNER = "owner", _("Propriétaire")
        ADMIN = "admin", _("Administrateur")
        MANAGER = "manager", _("Manager")
        MEMBER = "member", _("Membre")
        BILLING = "billing", _("Comptable")
        VIEWER = "viewer", _("Observateur")

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=16, choices=Role.choices, default=Role.MEMBER)
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["organization", "user"], name="uq_org_user"),
        ]
