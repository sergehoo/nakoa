"""Signaux Django pour l'app printers."""

from __future__ import annotations

import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify

logger = logging.getLogger(__name__)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def auto_create_printer_profile(sender, instance, created, **kwargs):
    """Crée automatiquement un PrinterProfile minimal pour les comptes imprimeurs.

    Déclenché à la création d'un User avec primary_role='printer' (le rôle est défini
    à l'inscription côté frontend). Pour 'printer_agent', le profil sera lié plus tard
    via PrinterAgent par le manager de l'imprimerie.
    """
    if not created:
        return

    role = getattr(instance, "primary_role", None)
    if role != "printer":
        return

    # Évite de planter si l'app n'est pas encore migrée (ex: setup test, fixtures)
    try:
        from .models import PrinterProfile
    except Exception:  # noqa: BLE001
        return

    # Idempotence
    if PrinterProfile.objects.filter(owner=instance).exists():
        return

    # Slug unique basé sur l'email
    base_slug = slugify(instance.email.split("@")[0])[:160] or f"printer-{instance.id}"
    slug = base_slug
    counter = 1
    while PrinterProfile.objects.filter(slug=slug).exists():
        counter += 1
        slug = f"{base_slug}-{counter}"

    legal_name = (
        f"{instance.first_name} {instance.last_name}".strip()
        or instance.email.split("@")[0]
    )

    try:
        PrinterProfile.objects.create(
            owner=instance,
            legal_name=legal_name,
            trade_name="",
            slug=slug,
            country=getattr(instance, "country", "") or "CI",
        )
        logger.info("PrinterProfile auto-créé pour user %s (slug=%s)", instance.id, slug)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Échec auto-création PrinterProfile pour user %s : %s", instance.id, exc)
