"""Migration initiale du Revenue Engine.

Écrite à la main car le container prod a /app en read-only et makemigrations
ne peut pas écrire. Reflète apps/revenue_engine/models.py.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ============================================================
        # MonetizationConfig — singleton de configuration globale
        # ============================================================
        migrations.CreateModel(
            name="MonetizationConfig",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("default_currency", models.CharField(default="XOF", max_length=8)),
                ("default_vat_rate", models.DecimalField(decimal_places=4, default=Decimal("0.18"), max_digits=6)),
                ("default_commission_rate", models.DecimalField(decimal_places=4, default=Decimal("0.08"), max_digits=6)),
                ("default_commission_min", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15)),
                ("default_commission_max", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ("log_evaluations", models.BooleanField(default=True)),
                ("commissions_kill_switch", models.BooleanField(default=False)),
            ],
            options={
                "verbose_name": "Configuration monétisation",
                "verbose_name_plural": "Configuration monétisation",
            },
        ),

        # ============================================================
        # RevenueSource
        # ============================================================
        migrations.CreateModel(
            name="RevenueSource",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.CharField(db_index=True, max_length=64, unique=True, verbose_name="code")),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("commission", "Commission marketplace"),
                            ("subscription", "Abonnements SaaS"),
                            ("advertising", "Publicité sponsorisée"),
                            ("premium_service", "Services premium"),
                            ("ai", "IA premium"),
                            ("api", "API premium"),
                            ("delivery", "Livraison"),
                            ("insurance", "Assurance commande"),
                            ("financing", "Financement / BNPL"),
                            ("escrow", "Escrow"),
                            ("graphics_marketplace", "Marketplace graphique"),
                            ("business_intelligence", "Business Intelligence"),
                            ("other", "Autre"),
                        ],
                        db_index=True,
                        max_length=40,
                        verbose_name="type",
                    ),
                ),
                ("label", models.CharField(max_length=200, verbose_name="libellé")),
                ("description", models.TextField(blank=True, default="", verbose_name="description")),
                ("is_enabled", models.BooleanField(db_index=True, default=True, verbose_name="activé")),
                ("icon", models.CharField(blank=True, default="", max_length=64, verbose_name="icône")),
                ("sort_order", models.PositiveIntegerField(default=100, verbose_name="ordre d'affichage")),
                ("config", models.JSONField(blank=True, default=dict, verbose_name="configuration")),
            ],
            options={
                "ordering": ("sort_order", "code"),
                "verbose_name": "Source de revenu",
                "verbose_name_plural": "Sources de revenus",
            },
        ),

        # ============================================================
        # CommissionRule
        # ============================================================
        migrations.CreateModel(
            name="CommissionRule",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=200, verbose_name="nom")),
                ("description", models.TextField(blank=True, default="", verbose_name="description")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="active")),
                ("conditions", models.JSONField(blank=True, default=dict, verbose_name="conditions (DSL JSON)")),
                (
                    "calculation_type",
                    models.CharField(
                        choices=[
                            ("percentage", "Pourcentage"),
                            ("fixed", "Montant fixe"),
                            ("combined", "Fixe + pourcentage"),
                        ],
                        default="percentage",
                        max_length=20,
                        verbose_name="type de calcul",
                    ),
                ),
                ("percentage", models.DecimalField(decimal_places=4, default=Decimal("0"), max_digits=6, verbose_name="pourcentage")),
                ("fixed_amount", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15, verbose_name="montant fixe")),
                ("min_commission", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15, verbose_name="commission minimum")),
                ("max_commission", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True, verbose_name="commission maximum")),
                ("priority", models.PositiveIntegerField(db_index=True, default=100, verbose_name="priorité")),
                (
                    "stacking",
                    models.CharField(
                        choices=[("stop_on_match", "Stop dès qu'une règle matche"), ("additive", "Cumulable (additif)")],
                        default="stop_on_match", max_length=20, verbose_name="empilement",
                    ),
                ),
                ("active_from", models.DateTimeField(blank=True, null=True, verbose_name="actif à partir de")),
                ("active_until", models.DateTimeField(blank=True, null=True, verbose_name="actif jusqu'à")),
                ("applies_to_country", models.CharField(blank=True, default="", max_length=4)),
                ("applies_to_currency", models.CharField(blank=True, default="", max_length=8)),
                (
                    "source",
                    models.ForeignKey(
                        limit_choices_to={"kind": "commission"},
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="commission_rules",
                        to="revenue_engine.revenuesource",
                    ),
                ),
            ],
            options={
                "ordering": ("priority", "name"),
                "verbose_name": "Règle de commission",
                "verbose_name_plural": "Règles de commission",
            },
        ),
        migrations.AddIndex(
            model_name="commissionrule",
            index=models.Index(fields=["is_active", "priority"], name="revenue_eng_is_acti_4d8a4e_idx"),
        ),

        # ============================================================
        # RuleVersion
        # ============================================================
        migrations.CreateModel(
            name="RuleVersion",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("version_number", models.PositiveIntegerField()),
                ("snapshot", models.JSONField(help_text="Sérialisation complète de la règle à cet instant.")),
                ("reason", models.TextField(blank=True, default="")),
                (
                    "changed_by",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "rule",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="versions",
                        to="revenue_engine.commissionrule",
                    ),
                ),
            ],
            options={
                "ordering": ("-version_number",),
                "unique_together": {("rule", "version_number")},
                "verbose_name": "Version de règle",
                "verbose_name_plural": "Versions de règles",
            },
        ),

        # ============================================================
        # RuleAuditLog
        # ============================================================
        migrations.CreateModel(
            name="RuleAuditLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "action",
                    models.CharField(
                        choices=[
                            ("create", "Création"), ("update", "Modification"),
                            ("delete", "Suppression"), ("enable", "Activation"),
                            ("disable", "Désactivation"), ("rollback", "Restauration version"),
                        ],
                        max_length=20,
                    ),
                ),
                ("target_type", models.CharField(help_text="Ex: CommissionRule, RevenueSource.", max_length=64)),
                ("target_id", models.CharField(blank=True, default="", max_length=64)),
                ("target_label", models.CharField(blank=True, default="", max_length=200)),
                ("before", models.JSONField(blank=True, default=dict)),
                ("after", models.JSONField(blank=True, default=dict)),
                ("reason", models.TextField(blank=True, default="")),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "verbose_name": "Entrée d'audit",
                "verbose_name_plural": "Audit du Revenue Engine",
            },
        ),

        # ============================================================
        # RuleEvaluationLog
        # ============================================================
        migrations.CreateModel(
            name="RuleEvaluationLog",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order_id", models.UUIDField(db_index=True)),
                ("matched", models.BooleanField(default=False)),
                ("computed_amount", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15)),
                ("context_snapshot", models.JSONField(default=dict)),
                ("details", models.JSONField(blank=True, default=dict)),
                (
                    "rule",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="revenue_engine.commissionrule",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "verbose_name": "Évaluation de règle",
                "verbose_name_plural": "Évaluations de règles",
            },
        ),
        migrations.AddIndex(
            model_name="ruleevaluationlog",
            index=models.Index(fields=["order_id", "created_at"], name="revenue_eng_order_i_2a9c1f_idx"),
        ),

        # ============================================================
        # RevenueEntry
        # ============================================================
        migrations.CreateModel(
            name="RevenueEntry",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=15)),
                ("currency", models.CharField(default="XOF", max_length=8)),
                ("occurred_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("order_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("printer_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("customer_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("country", models.CharField(blank=True, default="", max_length=4)),
                ("category", models.CharField(blank=True, default="", max_length=80)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "source",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="revenue_entries",
                        to="revenue_engine.revenuesource",
                    ),
                ),
            ],
            options={
                "ordering": ("-occurred_at",),
                "verbose_name": "Entrée de revenu",
                "verbose_name_plural": "Entrées de revenu",
            },
        ),
        migrations.AddIndex(
            model_name="revenueentry",
            index=models.Index(fields=["source", "occurred_at"], name="revenue_eng_source__7b3e0c_idx"),
        ),
        migrations.AddIndex(
            model_name="revenueentry",
            index=models.Index(fields=["country", "occurred_at"], name="revenue_eng_country_e9a4d2_idx"),
        ),
    ]
