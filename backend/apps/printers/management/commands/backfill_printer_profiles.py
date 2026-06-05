"""Crée un PrinterProfile pour tous les users 'printer' qui n'en ont pas.

Usage :
    python manage.py backfill_printer_profiles
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.printers.models import PrinterProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Crée un PrinterProfile minimal pour les comptes 'printer' sans profil."

    def handle(self, *args, **options):
        users = User.objects.filter(primary_role="printer")
        created = 0
        skipped = 0

        for user in users:
            if PrinterProfile.objects.filter(owner=user).exists():
                skipped += 1
                continue

            base_slug = slugify(user.email.split("@")[0])[:160] or f"printer-{user.id}"
            slug = base_slug
            counter = 1
            while PrinterProfile.objects.filter(slug=slug).exists():
                counter += 1
                slug = f"{base_slug}-{counter}"

            legal_name = (
                f"{user.first_name} {user.last_name}".strip()
                or user.email.split("@")[0]
            )

            PrinterProfile.objects.create(
                owner=user,
                legal_name=legal_name,
                trade_name="",
                slug=slug,
                country=getattr(user, "country", "") or "CI",
            )
            created += 1
            self.stdout.write(self.style.SUCCESS(f"  ✓ {user.email} → {slug}"))

        self.stdout.write(self.style.SUCCESS(
            f"\n{created} profil(s) créé(s) · {skipped} déjà existant(s)."
        ))
