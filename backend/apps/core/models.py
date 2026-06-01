"""Modèles abstraits réutilisables par toutes les apps."""

from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


# ============================================================
# Managers
# ============================================================
class ActiveQuerySet(models.QuerySet):
    """QuerySet qui filtre les objets soft-deleted par défaut."""

    def active(self):
        return self.filter(deleted_at__isnull=True)

    def deleted(self):
        return self.filter(deleted_at__isnull=False)


class ActiveManager(models.Manager.from_queryset(ActiveQuerySet)):
    """Manager retournant uniquement les objets non supprimés."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


# ============================================================
# Abstract models
# ============================================================
class UUIDPKModel(models.Model):
    """Clé primaire UUID v4 — sécurité et scalabilité."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class TimeStampedModel(models.Model):
    """Champs created_at / updated_at automatiques."""

    created_at = models.DateTimeField(_("créé le"), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_("modifié le"), auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteModel(models.Model):
    """Suppression logique via deleted_at + manager personnalisé."""

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager.from_queryset(ActiveQuerySet)()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False, hard=False):
        if hard:
            return super().delete(using=using, keep_parents=keep_parents)
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])
        return 1, {self._meta.label: 1}

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])


class AuditableModel(models.Model):
    """Trace l'utilisateur qui a créé / modifié l'enregistrement."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        related_query_name="+",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        related_query_name="+",
    )

    class Meta:
        abstract = True


class BaseModel(UUIDPKModel, TimeStampedModel, SoftDeleteModel, AuditableModel):
    """Base à utiliser par défaut pour tous les modèles métier."""

    class Meta:
        abstract = True


# ============================================================
# Choix communs
# ============================================================
class Country(models.TextChoices):
    """Pays prioritaires PrintHub (UEMOA + CEMAC + autres)."""

    CI = "CI", _("Côte d'Ivoire")
    SN = "SN", _("Sénégal")
    BJ = "BJ", _("Bénin")
    TG = "TG", _("Togo")
    BF = "BF", _("Burkina Faso")
    ML = "ML", _("Mali")
    NE = "NE", _("Niger")
    CM = "CM", _("Cameroun")
    GA = "GA", _("Gabon")
    GH = "GH", _("Ghana")
    NG = "NG", _("Nigeria")
    FR = "FR", _("France")
    OTHER = "ZZ", _("Autre")


class Currency(models.TextChoices):
    XOF = "XOF", _("Franc CFA BCEAO")
    XAF = "XAF", _("Franc CFA BEAC")
    EUR = "EUR", _("Euro")
    USD = "USD", _("Dollar US")
    NGN = "NGN", _("Naira")
    GHS = "GHS", _("Cedi")
