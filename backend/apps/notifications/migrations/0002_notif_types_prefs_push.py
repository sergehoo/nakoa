"""Ajoute NotificationType, UserNotificationPreference et WebPushSubscription.

⚠️ Renomme ce fichier si tu as déjà des migrations >= 0002 sur cette app et
ajuste la dépendance vers ta dernière migration. Le contenu reste valide.
"""

from __future__ import annotations

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ============================================================
        # NotificationType — types administrables par le Super Admin
        # ============================================================
        migrations.CreateModel(
            name="NotificationType",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("code", models.SlugField(db_index=True, max_length=80, unique=True, verbose_name="code")),
                ("label", models.CharField(max_length=160, verbose_name="libellé")),
                ("description", models.TextField(blank=True, default="", verbose_name="description")),
                ("icon", models.CharField(blank=True, default="", max_length=64, verbose_name="icône")),
                (
                    "category",
                    models.CharField(
                        choices=[
                            ("transactional", "Transactionnel"),
                            ("marketing", "Marketing"),
                            ("system", "Système"),
                            ("security", "Sécurité"),
                        ],
                        db_index=True, default="transactional", max_length=20, verbose_name="catégorie",
                    ),
                ),
                ("default_channels", models.JSONField(blank=True, default=list, verbose_name="canaux par défaut")),
                ("is_active", models.BooleanField(db_index=True, default=True, verbose_name="type actif globalement")),
                ("is_user_toggleable", models.BooleanField(default=True, verbose_name="modifiable par l'utilisateur")),
                ("sort_order", models.PositiveIntegerField(db_index=True, default=100)),
            ],
            options={
                "ordering": ("sort_order", "label"),
                "verbose_name": "Type de notification",
                "verbose_name_plural": "Types de notifications",
            },
        ),

        # ============================================================
        # UserNotificationPreference
        # ============================================================
        migrations.CreateModel(
            name="UserNotificationPreference",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("channels", models.JSONField(blank=True, default=list, verbose_name="canaux activés")),
                (
                    "notification_type",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="user_preferences",
                        to="notifications.notificationtype",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_preferences",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "unique_together": {("user", "notification_type")},
                "verbose_name": "Préférence notification",
                "verbose_name_plural": "Préférences notifications",
            },
        ),
        migrations.AddIndex(
            model_name="usernotificationpreference",
            index=models.Index(fields=["user", "notification_type"], name="notificatio_user_id_8c1f2d_idx"),
        ),

        # ============================================================
        # WebPushSubscription
        # ============================================================
        migrations.CreateModel(
            name="WebPushSubscription",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, db_index=True, null=True)),
                ("endpoint", models.TextField(unique=True)),
                ("p256dh", models.CharField(max_length=255)),
                ("auth", models.CharField(max_length=255)),
                ("user_agent", models.CharField(blank=True, default="", max_length=500)),
                ("label", models.CharField(blank=True, default="", max_length=120)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("failure_count", models.PositiveSmallIntegerField(default=0)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="push_subscriptions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-created_at",),
                "verbose_name": "Abonnement Web Push",
                "verbose_name_plural": "Abonnements Web Push",
            },
        ),
        migrations.AddIndex(
            model_name="webpushsubscription",
            index=models.Index(fields=["user", "is_active"], name="notificatio_user_id_7a3b9e_idx"),
        ),
    ]
