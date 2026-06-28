"""Migration de réparation — ajoute les colonnes de 0002 si elles manquent.

Cause : la migration 0002 a échoué en cours de route puis été marquée appliquée
via `migrate --fake`. Résultat : django_migrations dit que 0002 est appliquée
mais les colonnes (code, is_public, …) n'ont jamais été créées.

Cette migration est 100% idempotente — elle utilise ALTER TABLE ... ADD COLUMN
IF NOT EXISTS et CREATE INDEX IF NOT EXISTS.
"""

from __future__ import annotations

from django.db import migrations


def _add_missing_columns(apps, schema_editor):
    schema_editor.execute("""
        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS code varchar(64) NOT NULL DEFAULT '';

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT TRUE;

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS is_highlight boolean NOT NULL DEFAULT FALSE;

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0;

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS tagline varchar(200) NOT NULL DEFAULT '';

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS cta_label varchar(80) NOT NULL DEFAULT '';

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS target_role varchar(24) NOT NULL DEFAULT 'any';

        ALTER TABLE subscriptions_plan
          ADD COLUMN IF NOT EXISTS quotas jsonb NOT NULL DEFAULT '{}'::jsonb;
    """)

    # Backfille les codes vides avec un slug stable basé sur tier+name
    schema_editor.execute("""
        UPDATE subscriptions_plan
        SET code = LOWER(REGEXP_REPLACE(tier || '-' || name, '[^a-zA-Z0-9-]+', '-', 'g'))
        WHERE code = '' OR code IS NULL;
    """)

    # Drop éventuelle contrainte unique stale + index LIKE résiduel
    schema_editor.execute("""
        ALTER TABLE subscriptions_plan
          DROP CONSTRAINT IF EXISTS subscriptions_plan_code_key;
        DROP INDEX IF EXISTS subscriptions_plan_code_c3950c19_like;
    """)

    # Ajoute la contrainte unique + index LIKE (équivalent SlugField(unique=True))
    schema_editor.execute("""
        ALTER TABLE subscriptions_plan
          ADD CONSTRAINT subscriptions_plan_code_key UNIQUE (code);
        CREATE INDEX IF NOT EXISTS subscriptions_plan_code_c3950c19_like
          ON subscriptions_plan (code varchar_pattern_ops);
    """)

    # Index sur sort_order (déclaré db_index=True)
    schema_editor.execute("""
        CREATE INDEX IF NOT EXISTS subscriptions_plan_sort_order_idx
          ON subscriptions_plan (sort_order);
        CREATE INDEX IF NOT EXISTS subscriptions_plan_target_role_idx
          ON subscriptions_plan (target_role);
    """)


def _reverse_noop(apps, schema_editor):
    # Pas de rollback : on ne veut pas perdre les données.
    return None


class Migration(migrations.Migration):

    dependencies = [
        ("subscriptions", "0002_plan_subscription_engine_fields"),
    ]

    operations = [
        migrations.RunPython(_add_missing_columns, _reverse_noop),
    ]
