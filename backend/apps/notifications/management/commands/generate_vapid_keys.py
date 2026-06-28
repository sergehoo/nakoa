"""Génère une paire de clés VAPID pour Web Push.

Usage :
    python manage.py generate_vapid_keys

Copier la sortie dans le fichier .env de production :
    VAPID_PUBLIC_KEY=...
    VAPID_PRIVATE_KEY=...
    VAPID_CLAIM_EMAIL=mailto:tech@nakoahub.com
"""

from __future__ import annotations

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Génère une paire de clés VAPID pour les notifications Web Push."

    def handle(self, *args, **opts):
        try:
            from py_vapid import Vapid01
        except ImportError:
            self.stderr.write(self.style.ERROR(
                "py-vapid n'est pas installé. Lancez : pip install py-vapid pywebpush"
            ))
            return

        v = Vapid01()
        v.generate_keys()
        # py-vapid >= 1.9 expose private_pem() / public_key (base64url)
        try:
            private_pem = v.private_pem().decode()
            public_key = v.public_key_base64()  # type: ignore[attr-defined]
        except AttributeError:
            # Fallback pour les versions plus anciennes
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.serialization import (
                Encoding, NoEncryption, PrivateFormat, PublicFormat,
            )
            import base64

            private_pem = v.private_key.private_bytes(
                Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()
            ).decode()
            public_raw = v.public_key.public_bytes(
                Encoding.X962, PublicFormat.UncompressedPoint
            )
            public_key = base64.urlsafe_b64encode(public_raw).decode().rstrip("=")

        self.stdout.write(self.style.SUCCESS("✓ Clés VAPID générées."))
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("--- À copier dans .env.prod ---"))
        self.stdout.write(f"VAPID_PUBLIC_KEY={public_key}")
        self.stdout.write("VAPID_PRIVATE_KEY=<<<EOF")
        self.stdout.write(private_pem.strip())
        self.stdout.write("EOF")
        self.stdout.write("VAPID_CLAIM_EMAIL=mailto:tech@nakoahub.com")
        self.stdout.write("")
        self.stdout.write(self.style.NOTICE(
            "Note : la clé privée est au format PEM multi-lignes. "
            "Dans .env utiliser la syntaxe heredoc ou échapper les sauts de ligne."
        ))
