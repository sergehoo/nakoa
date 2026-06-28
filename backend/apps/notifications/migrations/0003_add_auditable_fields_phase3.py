"""Ajoute les colonnes AuditableModel sur les 3 modèles de la phase 3
(NotificationType, UserNotificationPreference, WebPushSubscription)."""

from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _add_columns(apps, schema_editor):
    user_table = apps.get_model(settings.AUTH_USER_MODEL).objects.model._meta.db_table
    schema_editor.execute(f"""
        ALTER TABLE notifications_notificationtype
          ADD COLUMN IF NOT EXISTS created_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE notifications_notificationtype
          ADD COLUMN IF NOT EXISTS updated_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

        ALTER TABLE notifications_usernotificationpreference
          ADD COLUMN IF NOT EXISTS created_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE notifications_usernotificationpreference
          ADD COLUMN IF NOT EXISTS updated_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

        ALTER TABLE notifications_webpushsubscription
          ADD COLUMN IF NOT EXISTS created_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE notifications_webpushsubscription
          ADD COLUMN IF NOT EXISTS updated_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
    """)


def _drop_columns(apps, schema_editor):
    schema_editor.execute("""
        ALTER TABLE notifications_notificationtype DROP COLUMN IF EXISTS created_by_id;
        ALTER TABLE notifications_notificationtype DROP COLUMN IF EXISTS updated_by_id;
        ALTER TABLE notifications_usernotificationpreference DROP COLUMN IF EXISTS created_by_id;
        ALTER TABLE notifications_usernotificationpreference DROP COLUMN IF EXISTS updated_by_id;
        ALTER TABLE notifications_webpushsubscription DROP COLUMN IF EXISTS created_by_id;
        ALTER TABLE notifications_webpushsubscription DROP COLUMN IF EXISTS updated_by_id;
    """)


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_notif_types_prefs_push"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(_add_columns, _drop_columns),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                # NotificationType
                migrations.AddField(
                    model_name="notificationtype", name="created_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="notificationtype", name="updated_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                # UserNotificationPreference
                migrations.AddField(
                    model_name="usernotificationpreference", name="created_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="usernotificationpreference", name="updated_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                # WebPushSubscription
                migrations.AddField(
                    model_name="webpushsubscription", name="created_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="webpushsubscription", name="updated_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
    ]
