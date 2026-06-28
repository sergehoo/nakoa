"""Drop la contrainte UNIQUE sur Plan.tier.

Désormais `code` est l'identifiant stable. Le champ `tier` redevient une simple
catégorie partageable (plusieurs plans peuvent être tier=pro).
"""

from __future__ import annotations

from django.db import migrations, models


def _drop_unique(apps, schema_editor):
    """Drop la contrainte unique et l'index LIKE générés par Django pour tier."""
    schema_editor.execute("""
        ALTER TABLE subscriptions_plan
          DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_key;
        DROP INDEX IF EXISTS subscriptions_plan_tier_6973829b_like;

        -- Crée à la place un index simple sur tier (db_index=True)
        CREATE INDEX IF NOT EXISTS subscriptions_plan_tier_idx
          ON subscriptions_plan (tier);
    """)


def _restore_unique(apps, schema_editor):
    """Rollback : recrée la contrainte unique (peut échouer s'il y a des doublons)."""
    schema_editor.execute("""
        DROP INDEX IF EXISTS subscriptions_plan_tier_idx;
        ALTER TABLE subscriptions_plan
          ADD CONSTRAINT subscriptions_plan_tier_key UNIQUE (tier);
        CREATE INDEX subscriptions_plan_tier_6973829b_like
          ON subscriptions_plan (tier varchar_pattern_ops);
    """)


class Migration(migrations.Migration):

    dependencies = [
        ("subscriptions", "0003_repair_phase3_columns"),
    ]

    operations = [
        # Modifications physiques en SQL (idempotentes)
        migrations.RunPython(_drop_unique, _restore_unique),

        # Synchronise l'état Django ORM
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AlterField(
                    model_name="plan",
                    name="tier",
                    field=models.CharField(
                        choices=[
                            ("basic", "Basic"),
                            ("pro", "Pro"),
                            ("premium", "Premium"),
                            ("enterprise", "Enterprise"),
                        ],
                        db_index=True,
                        max_length=16,
                    ),
                ),
            ],
        ),
    ]
