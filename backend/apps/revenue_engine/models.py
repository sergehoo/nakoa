"""Modèles du moteur de monétisation Nakoa.

Toutes les sources de revenus, règles de commission, abonnements et frais
sont décrits en base. Aucune règle financière n'est codée en dur.

Le BO Super Admin permet :
- d'activer/désactiver chaque source (RevenueSource.is_enabled)
- de créer/éditer des règles avec un DSL JSON (CommissionRule.conditions)
- de versionner et tracer chaque modification (RuleVersion, RuleAuditLog)
- de monitorer l'exécution des règles sur chaque commande (RuleEvaluationLog)
- de mesurer le revenu réel généré par source (RevenueEntry)
"""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, UUIDPKModel, TimeStampedModel


# ============================================================
# Sources de revenus — l'ensemble des leviers monétisables
# ============================================================
class RevenueSource(BaseModel):
    """Une source de revenu activable / désactivable globalement.

    Le Super Admin contrôle ici quel levier est ouvert. Les apps qui calculent
    de l'argent (commission, abonnement, publicité…) doivent toujours vérifier
    `RevenueSource.is_enabled` avant de prélever.
    """

    class Kind(models.TextChoices):
        COMMISSION = "commission", _("Commission marketplace")
        SUBSCRIPTION = "subscription", _("Abonnements SaaS")
        ADVERTISING = "advertising", _("Publicité sponsorisée")
        PREMIUM_SERVICE = "premium_service", _("Services premium")
        AI = "ai", _("IA premium")
        API = "api", _("API premium")
        DELIVERY = "delivery", _("Livraison")
        INSURANCE = "insurance", _("Assurance commande")
        FINANCING = "financing", _("Financement / BNPL")
        ESCROW = "escrow", _("Escrow")
        GRAPHICS_MARKETPLACE = "graphics_marketplace", _("Marketplace graphique")
        BUSINESS_INTELLIGENCE = "business_intelligence", _("Business Intelligence")
        OTHER = "other", _("Autre")

    code = models.CharField(_("code"), max_length=64, unique=True, db_index=True)
    kind = models.CharField(_("type"), max_length=40, choices=Kind.choices, db_index=True)
    label = models.CharField(_("libellé"), max_length=200)
    description = models.TextField(_("description"), blank=True, default="")

    is_enabled = models.BooleanField(_("activé"), default=True, db_index=True)
    icon = models.CharField(_("icône"), max_length=64, blank=True, default="")
    sort_order = models.PositiveIntegerField(_("ordre d'affichage"), default=100)

    # Paramétrage libre pour les leviers (clés/valeurs spécifiques à chaque kind)
    config = models.JSONField(_("configuration"), default=dict, blank=True)

    class Meta:
        ordering = ("sort_order", "code")
        verbose_name = _("Source de revenu")
        verbose_name_plural = _("Sources de revenus")

    def __str__(self) -> str:
        return f"{self.label} ({self.code})"


# ============================================================
# Configuration globale — singleton
# ============================================================
class MonetizationConfig(UUIDPKModel, TimeStampedModel):
    """Singleton de configuration globale du moteur de monétisation.

    Devises supportées, TVA par défaut, plafonds, comportement par défaut
    quand aucune règle ne matche, etc.
    """

    default_currency = models.CharField(max_length=8, default="XOF")
    default_vat_rate = models.DecimalField(
        max_digits=6, decimal_places=4, default=Decimal("0.18"),
        help_text=_("TVA appliquée par défaut (ex: 0.18 = 18%)."),
    )
    default_commission_rate = models.DecimalField(
        max_digits=6, decimal_places=4, default=Decimal("0.08"),
        help_text=_("Commission par défaut si aucune règle ne matche."),
    )
    default_commission_min = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal("0"),
        help_text=_("Montant minimum de commission, toutes règles confondues."),
    )
    default_commission_max = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        help_text=_("Montant maximum de commission, toutes règles confondues."),
    )

    # Lorsqu'aucune source de revenu n'est explicitement définie côté Order,
    # on peut choisir de loguer quand même (utile pour l'audit financier).
    log_evaluations = models.BooleanField(default=True)

    # Permet de désactiver TOUT le prélèvement de commission en un clic (kill switch).
    commissions_kill_switch = models.BooleanField(
        default=False,
        help_text=_("Si activé, AUCUNE commission n'est prélevée. Kill switch d'urgence."),
    )

    class Meta:
        verbose_name = _("Configuration monétisation")
        verbose_name_plural = _("Configuration monétisation")

    def __str__(self) -> str:
        return "Configuration Revenue Engine"

    @classmethod
    def get_solo(cls) -> "MonetizationConfig":
        """Retourne l'instance unique (la crée si nécessaire)."""
        obj = cls.objects.first()
        if obj is None:
            obj = cls.objects.create()
        return obj

    def save(self, *args, **kwargs):
        # Garde-fou : un seul singleton.
        if not self.pk and MonetizationConfig.objects.exists():
            raise ValidationError("MonetizationConfig est un singleton.")
        super().save(*args, **kwargs)


# ============================================================
# Règle de commission — le cœur du moteur
# ============================================================
class CommissionRule(BaseModel):
    """Règle de calcul de commission, évaluée à la complétion d'une commande.

    Chaque règle a :
    - une condition DSL JSON (apps.revenue_engine.services.rule_engine)
    - un calcul (% ou fixe ou combiné)
    - des bornes min/max
    - une priorité (plus basse = appliquée en premier)
    - une fenêtre de validité (active_from / active_until)
    - une stratégie d'empilement (stop_on_match / continue)
    """

    class CalculationType(models.TextChoices):
        PERCENTAGE = "percentage", _("Pourcentage")
        FIXED = "fixed", _("Montant fixe")
        COMBINED = "combined", _("Fixe + pourcentage")

    class Stacking(models.TextChoices):
        STOP_ON_MATCH = "stop_on_match", _("Stop dès qu'une règle matche")
        ADDITIVE = "additive", _("Cumulable (additif)")

    source = models.ForeignKey(
        RevenueSource, on_delete=models.PROTECT, related_name="commission_rules",
        limit_choices_to={"kind": RevenueSource.Kind.COMMISSION},
    )

    name = models.CharField(_("nom"), max_length=200)
    description = models.TextField(_("description"), blank=True, default="")
    is_active = models.BooleanField(_("active"), default=True, db_index=True)

    # Conditions : DSL JSON, ex: {"all": [{"fact": "order.total", "op": "gt", "value": 500000}]}
    conditions = models.JSONField(
        _("conditions (DSL JSON)"), default=dict, blank=True,
        help_text=_("DSL : {all:[…]} / {any:[…]} / {not:…} / {fact, op, value}."),
    )

    calculation_type = models.CharField(
        _("type de calcul"), max_length=20,
        choices=CalculationType.choices, default=CalculationType.PERCENTAGE,
    )
    percentage = models.DecimalField(
        _("pourcentage"), max_digits=6, decimal_places=4,
        default=Decimal("0"),
        help_text=_("Ex: 0.08 = 8% du montant HT de la commande."),
    )
    fixed_amount = models.DecimalField(
        _("montant fixe"), max_digits=15, decimal_places=2,
        default=Decimal("0"),
    )
    min_commission = models.DecimalField(
        _("commission minimum"), max_digits=15, decimal_places=2,
        default=Decimal("0"),
    )
    max_commission = models.DecimalField(
        _("commission maximum"), max_digits=15, decimal_places=2,
        null=True, blank=True,
    )

    priority = models.PositiveIntegerField(_("priorité"), default=100, db_index=True)
    stacking = models.CharField(
        _("empilement"), max_length=20, choices=Stacking.choices,
        default=Stacking.STOP_ON_MATCH,
    )

    active_from = models.DateTimeField(_("actif à partir de"), null=True, blank=True)
    active_until = models.DateTimeField(_("actif jusqu'à"), null=True, blank=True)

    # Restrictions optionnelles utiles pour les UI (les conditions DSL restent la vérité)
    applies_to_country = models.CharField(max_length=4, blank=True, default="")
    applies_to_currency = models.CharField(max_length=8, blank=True, default="")

    class Meta:
        ordering = ("priority", "name")
        verbose_name = _("Règle de commission")
        verbose_name_plural = _("Règles de commission")
        indexes = [
            models.Index(fields=["is_active", "priority"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_calculation_type_display()})"

    def is_currently_active(self) -> bool:
        now = timezone.now()
        if not self.is_active:
            return False
        if self.active_from and now < self.active_from:
            return False
        if self.active_until and now > self.active_until:
            return False
        return True


# ============================================================
# Versioning des règles — possibilité de revenir en arrière
# ============================================================
class RuleVersion(UUIDPKModel, TimeStampedModel):
    """Snapshot d'une CommissionRule à un instant T.

    À chaque save() d'une CommissionRule, une nouvelle RuleVersion est créée
    via le signal post_save (cf. signals.py). Permet le rollback côté BO.
    """

    rule = models.ForeignKey(
        CommissionRule, on_delete=models.CASCADE, related_name="versions",
    )
    version_number = models.PositiveIntegerField()
    snapshot = models.JSONField(help_text=_("Sérialisation complète de la règle à cet instant."))

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="+",
    )
    reason = models.TextField(blank=True, default="")

    class Meta:
        unique_together = (("rule", "version_number"),)
        ordering = ("-version_number",)
        verbose_name = _("Version de règle")
        verbose_name_plural = _("Versions de règles")


# ============================================================
# Audit — qui a changé quoi quand
# ============================================================
class RuleAuditLog(UUIDPKModel, TimeStampedModel):
    """Journal d'audit des modifications de configuration du Revenue Engine."""

    class Action(models.TextChoices):
        CREATE = "create", _("Création")
        UPDATE = "update", _("Modification")
        DELETE = "delete", _("Suppression")
        ENABLE = "enable", _("Activation")
        DISABLE = "disable", _("Désactivation")
        ROLLBACK = "rollback", _("Restauration version")

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="+",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    target_type = models.CharField(max_length=64, help_text=_("Ex: CommissionRule, RevenueSource."))
    target_id = models.CharField(max_length=64, blank=True, default="")
    target_label = models.CharField(max_length=200, blank=True, default="")

    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Entrée d'audit")
        verbose_name_plural = _("Audit du Revenue Engine")


# ============================================================
# Log d'évaluation — pour debug & traçabilité financière
# ============================================================
class RuleEvaluationLog(UUIDPKModel, TimeStampedModel):
    """Log de l'évaluation des règles sur une commande donnée.

    Permet de tracer pourquoi telle commission a été appliquée et de fournir
    un fil d'Ariane lisible au Super Admin et au support.
    """

    order_id = models.UUIDField(db_index=True)
    rule = models.ForeignKey(CommissionRule, null=True, blank=True, on_delete=models.SET_NULL)
    matched = models.BooleanField(default=False)
    computed_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    context_snapshot = models.JSONField(default=dict)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Évaluation de règle")
        verbose_name_plural = _("Évaluations de règles")
        indexes = [
            models.Index(fields=["order_id", "created_at"]),
        ]


# ============================================================
# Revenue Entry — ligne de revenu réellement encaissée
# ============================================================
class RevenueEntry(BaseModel):
    """Une ligne de revenu (commission, abonnement, pub, …) enregistrée.

    Sert d'oracle pour le dashboard de monétisation : on ne calcule jamais
    le CA en agrégeant des Orders, on agrège des RevenueEntry. Cela permet de
    découpler le BO finance des changements de schéma côté payments.
    """

    source = models.ForeignKey(
        RevenueSource, on_delete=models.PROTECT, related_name="revenue_entries",
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=8, default="XOF")
    occurred_at = models.DateTimeField(default=timezone.now, db_index=True)

    # Lien optionnel vers la commande (uuid pour éviter cycle d'imports).
    order_id = models.UUIDField(null=True, blank=True, db_index=True)
    printer_id = models.UUIDField(null=True, blank=True, db_index=True)
    customer_id = models.UUIDField(null=True, blank=True, db_index=True)
    country = models.CharField(max_length=4, blank=True, default="")
    category = models.CharField(max_length=80, blank=True, default="")

    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-occurred_at",)
        verbose_name = _("Entrée de revenu")
        verbose_name_plural = _("Entrées de revenu")
        indexes = [
            models.Index(fields=["source", "occurred_at"]),
            models.Index(fields=["country", "occurred_at"]),
        ]
