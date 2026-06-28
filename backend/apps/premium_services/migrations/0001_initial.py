"""Migration initiale des Premium Services."""

from __future__ import annotations

import uuid
from decimal import Decimal

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        # ============================================================
        # ServiceCategory
        # ============================================================
        migrations.CreateModel(
            name="ServiceCategory",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=120, verbose_name="nom")),
                ("slug", models.SlugField(max_length=80, unique=True)),
                ("description", models.TextField(blank=True, default="", verbose_name="description")),
                ("icon", models.CharField(blank=True, default="", max_length=64, verbose_name="icône")),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=100)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={
                "ordering": ("sort_order", "name"),
                "verbose_name": "Catégorie de service",
                "verbose_name_plural": "Catégories de services",
            },
        ),

        # ============================================================
        # PremiumService
        # ============================================================
        migrations.CreateModel(
            name="PremiumService",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.SlugField(db_index=True, max_length=80, unique=True)),
                ("name", models.CharField(max_length=200, verbose_name="nom")),
                ("description", models.TextField(blank=True, default="", verbose_name="description")),
                ("short_description", models.CharField(blank=True, default="", max_length=200, verbose_name="description courte")),
                ("icon", models.CharField(blank=True, default="", max_length=64, verbose_name="icône")),
                (
                    "pricing_type",
                    models.CharField(
                        choices=[
                            ("fixed", "Prix fixe"),
                            ("per_unit", "Prix par unité"),
                            ("variable", "Variable (devis)"),
                            ("percentage", "Pourcentage du total commande"),
                        ],
                        default="fixed", max_length=16, verbose_name="type de tarification",
                    ),
                ),
                ("base_price", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15, verbose_name="prix de base")),
                ("percentage", models.DecimalField(decimal_places=4, default=Decimal("0"), max_digits=6, verbose_name="pourcentage")),
                ("currency", models.CharField(default="XOF", max_length=8)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("is_visible", models.BooleanField(db_index=True, default=True, verbose_name="visible client")),
                ("is_required", models.BooleanField(default=False, verbose_name="obligatoire")),
                ("estimated_hours", models.PositiveIntegerField(default=0, verbose_name="durée estimée (h)")),
                ("applies_to_categories", models.JSONField(blank=True, default=list, verbose_name="catégories concernées")),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=100)),
                (
                    "category",
                    models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="services",
                        to="premium_services.servicecategory",
                    ),
                ),
            ],
            options={
                "ordering": ("sort_order", "name"),
                "verbose_name": "Service premium",
                "verbose_name_plural": "Services premium",
            },
        ),
        migrations.AddIndex(
            model_name="premiumservice",
            index=models.Index(fields=["is_visible", "is_active"], name="premium_ser_is_visi_691b47_idx"),
        ),

        # ============================================================
        # OrderService
        # ============================================================
        migrations.CreateModel(
            name="OrderService",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order_id", models.UUIDField(db_index=True)),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("unit_price", models.DecimalField(decimal_places=2, max_digits=15)),
                ("total", models.DecimalField(decimal_places=2, max_digits=15)),
                ("currency", models.CharField(default="XOF", max_length=8)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente"), ("in_progress", "En cours"),
                            ("delivered", "Livré"), ("refunded", "Remboursé"),
                        ],
                        db_index=True, default="pending", max_length=16,
                    ),
                ),
                ("notes", models.TextField(blank=True, default="")),
                (
                    "service",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="orders",
                        to="premium_services.premiumservice",
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "verbose_name": "Service commandé",
                "verbose_name_plural": "Services commandés",
            },
        ),
        migrations.AddIndex(
            model_name="orderservice",
            index=models.Index(fields=["order_id", "status"], name="premium_ser_order_i_a4b2c8_idx"),
        ),
    ]
