"""Migration initiale du Promotion Engine."""

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
        # PromotionCampaign
        # ============================================================
        migrations.CreateModel(
            name="PromotionCampaign",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("name", models.CharField(max_length=200, verbose_name="nom")),
                ("slug", models.SlugField(max_length=80, unique=True)),
                ("description", models.TextField(blank=True, default="", verbose_name="description")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Brouillon"), ("active", "Active"),
                            ("paused", "En pause"), ("ended", "Terminée"),
                        ],
                        db_index=True, default="draft", max_length=12, verbose_name="statut",
                    ),
                ),
                (
                    "discount_type",
                    models.CharField(
                        choices=[
                            ("percentage", "Pourcentage"), ("fixed", "Montant fixe"),
                            ("free_shipping", "Livraison gratuite"), ("credit", "Crédit / cashback"),
                        ],
                        default="percentage", max_length=20, verbose_name="type de remise",
                    ),
                ),
                ("discount_value", models.DecimalField(decimal_places=4, default=Decimal("0"), max_digits=15, verbose_name="valeur")),
                ("currency", models.CharField(default="XOF", max_length=8)),
                ("max_discount_amount", models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True, verbose_name="plafond de remise")),
                ("min_order_amount", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15, verbose_name="commande minimum")),
                ("starts_at", models.DateTimeField(default=django.utils.timezone.now, verbose_name="démarre le")),
                ("ends_at", models.DateTimeField(blank=True, null=True, verbose_name="se termine le")),
                ("total_usage_limit", models.PositiveIntegerField(blank=True, null=True, verbose_name="limite globale d'utilisation")),
                ("usage_count", models.PositiveIntegerField(default=0, editable=False)),
                ("per_user_limit", models.PositiveIntegerField(default=1, verbose_name="utilisations max par client")),
                ("conditions", models.JSONField(blank=True, default=dict, verbose_name="conditions (DSL JSON)")),
                ("is_public", models.BooleanField(default=False, verbose_name="publique (sans code)")),
            ],
            options={
                "ordering": ("-starts_at", "name"),
                "verbose_name": "Campagne promotionnelle",
                "verbose_name_plural": "Campagnes promotionnelles",
            },
        ),
        migrations.AddIndex(
            model_name="promotioncampaign",
            index=models.Index(fields=["status", "starts_at"], name="promotions__status_5f4c3a_idx"),
        ),

        # ============================================================
        # CouponCode
        # ============================================================
        migrations.CreateModel(
            name="CouponCode",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code", models.CharField(db_index=True, max_length=64, unique=True, verbose_name="code")),
                ("max_redemptions", models.PositiveIntegerField(blank=True, null=True, verbose_name="max redemptions")),
                ("redemption_count", models.PositiveIntegerField(default=0, editable=False)),
                ("is_active", models.BooleanField(default=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                (
                    "campaign",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="codes",
                        to="promotions.promotioncampaign",
                    ),
                ),
                (
                    "restricted_to_user",
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
                "verbose_name": "Code coupon",
                "verbose_name_plural": "Codes coupons",
            },
        ),

        # ============================================================
        # CouponRedemption
        # ============================================================
        migrations.CreateModel(
            name="CouponRedemption",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order_id", models.UUIDField(blank=True, db_index=True, null=True)),
                ("discount_amount", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=15)),
                ("currency", models.CharField(default="XOF", max_length=8)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "En attente"), ("applied", "Appliquée"), ("reversed", "Annulée"),
                        ],
                        db_index=True, default="applied", max_length=10,
                    ),
                ),
                ("reversal_reason", models.CharField(blank=True, default="", max_length=200)),
                (
                    "campaign",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="redemptions",
                        to="promotions.promotioncampaign",
                    ),
                ),
                (
                    "code",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="redemptions",
                        to="promotions.couponcode",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="coupon_redemptions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "verbose_name": "Utilisation de coupon",
                "verbose_name_plural": "Utilisations de coupons",
            },
        ),
        migrations.AddIndex(
            model_name="couponredemption",
            index=models.Index(fields=["user", "code"], name="promotions__user_id_8b3a7c_idx"),
        ),
    ]
