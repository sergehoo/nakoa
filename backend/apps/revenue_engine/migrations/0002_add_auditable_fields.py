"""Ajoute les colonnes héritées de AuditableModel (created_by_id, updated_by_id).

Oubli dans 0001_initial. Cette migration est sûre à rejouer.
"""

from __future__ import annotations

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _add_audit_columns(apps, schema_editor):
    """Ajoute les colonnes via SQL avec IF NOT EXISTS (idempotent)."""
    user_table = apps.get_model(settings.AUTH_USER_MODEL).objects.model._meta.db_table
    schema_editor.execute(f"""
        ALTER TABLE revenue_engine_revenuesource
          ADD COLUMN IF NOT EXISTS created_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE revenue_engine_revenuesource
          ADD COLUMN IF NOT EXISTS updated_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

        ALTER TABLE revenue_engine_commissionrule
          ADD COLUMN IF NOT EXISTS created_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE revenue_engine_commissionrule
          ADD COLUMN IF NOT EXISTS updated_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

        ALTER TABLE revenue_engine_revenueentry
          ADD COLUMN IF NOT EXISTS created_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        ALTER TABLE revenue_engine_revenueentry
          ADD COLUMN IF NOT EXISTS updated_by_id uuid NULL
          REFERENCES "{user_table}" (id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
    """)


def _drop_audit_columns(apps, schema_editor):
    schema_editor.execute("""
        ALTER TABLE revenue_engine_revenuesource DROP COLUMN IF EXISTS created_by_id;
        ALTER TABLE revenue_engine_revenuesource DROP COLUMN IF EXISTS updated_by_id;
        ALTER TABLE revenue_engine_commissionrule DROP COLUMN IF EXISTS created_by_id;
        ALTER TABLE revenue_engine_commissionrule DROP COLUMN IF EXISTS updated_by_id;
        ALTER TABLE revenue_engine_revenueentry DROP COLUMN IF EXISTS created_by_id;
        ALTER TABLE revenue_engine_revenueentry DROP COLUMN IF EXISTS updated_by_id;
    """)


class Migration(migrations.Migration):

    dependencies = [
        ("revenue_engine", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Création physique des colonnes (idempotent)
        migrations.RunPython(_add_audit_columns, _drop_audit_columns),

        # 2. Déclare les champs côté ORM Django (state_operations only)
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name="revenuesource", name="created_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="revenuesource", name="updated_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="commissionrule", name="created_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="commissionrule", name="updated_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="revenueentry", name="created_by",
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+", related_query_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                migrations.AddField(
                    model_name="revenueentry", name="updated_by",
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
