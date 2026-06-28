"""Répare manuellement l'état partiellement appliqué de subscriptions.0002.

Contexte : la migration 0002_plan_subscription_engine_fields a été interrompue
plusieurs fois, laissant des artefacts en base (index _like, contrainte unique).
Django ne peut plus rejouer la migration car l'index existe déjà.

Cette commande :
1. Drop les artefacts résiduels (index + contrainte).
2. Marque 0002 comme appliquée dans django_migrations (sans toucher au schéma).
3. Laisse 0003_repair_phase3_columns créer/réparer les colonnes manquantes
   lors du `migrate` suivant.

Usage :
    python manage.py repair_plan_migration
    python manage.py migrate                    # joue 0003
    python manage.py seed_subscription_plans    # OK
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import connection, transaction


class Command(BaseCommand):
    help = "Répare l'état bloqué de la migration subscriptions.0002."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Affiche les actions sans rien modifier.",
        )

    def handle(self, *args, dry_run=False, **opts):
        self.stdout.write(self.style.WARNING("=== Diagnostic ==="))

        with connection.cursor() as cur:
            # 1. État actuel de subscriptions_plan
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'subscriptions_plan'
                ORDER BY column_name;
            """)
            cols = [r[0] for r in cur.fetchall()]
            self.stdout.write(f"Colonnes actuelles : {', '.join(cols)}")

            cur.execute("""
                SELECT indexname FROM pg_indexes
                WHERE tablename = 'subscriptions_plan'
                ORDER BY indexname;
            """)
            indexes = [r[0] for r in cur.fetchall()]
            self.stdout.write(f"Index actuels : {', '.join(indexes)}")

            cur.execute("""
                SELECT name FROM django_migrations
                WHERE app = 'subscriptions' ORDER BY name;
            """)
            migs = [r[0] for r in cur.fetchall()]
            self.stdout.write(f"Migrations marquées appliquées : {', '.join(migs)}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n--dry-run : aucune modification."))
            return

        self.stdout.write(self.style.WARNING("\n=== Réparation ==="))

        with transaction.atomic(), connection.cursor() as cur:
            # 2. Drop les artefacts résiduels
            cur.execute("DROP INDEX IF EXISTS subscriptions_plan_code_c3950c19_like;")
            self.stdout.write("✓ Index _like droppé (s'il existait).")

            cur.execute(
                "ALTER TABLE subscriptions_plan "
                "DROP CONSTRAINT IF EXISTS subscriptions_plan_code_key;"
            )
            self.stdout.write("✓ Contrainte UNIQUE droppée (si elle existait).")

            # 3. Marque 0002 comme appliquée (si pas déjà fait)
            cur.execute(
                "INSERT INTO django_migrations (app, name, applied) "
                "VALUES ('subscriptions', '0002_plan_subscription_engine_fields', NOW()) "
                "ON CONFLICT DO NOTHING;"
            )
            if cur.rowcount > 0:
                self.stdout.write("✓ Migration 0002 marquée comme appliquée.")
            else:
                self.stdout.write("✓ Migration 0002 était déjà marquée appliquée.")

        self.stdout.write(self.style.SUCCESS(
            "\n✓ Réparation terminée. Lance maintenant :\n"
            "    python manage.py migrate\n"
            "    python manage.py seed_subscription_plans"
        ))
