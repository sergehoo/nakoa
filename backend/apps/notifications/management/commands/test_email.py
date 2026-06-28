"""Test rapide d'envoi d'email pour valider la config SMTP.

Usage :
    python manage.py test_email votre.email@example.com
    python manage.py test_email votre.email@example.com --subject "Test Nakoa"
"""

from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Envoie un email de test pour valider la configuration SMTP."

    def add_arguments(self, parser):
        parser.add_argument("to", type=str, help="Adresse email de destination")
        parser.add_argument("--subject", type=str, default="Test SMTP Nakoa")

    def handle(self, *args, **opts):
        to = opts["to"]
        subject = opts["subject"]

        # Affiche la config actuelle
        self.stdout.write(self.style.NOTICE("Configuration SMTP actuelle :"))
        self.stdout.write(f"  EMAIL_BACKEND   = {settings.EMAIL_BACKEND}")
        self.stdout.write(f"  EMAIL_HOST      = {settings.EMAIL_HOST}")
        self.stdout.write(f"  EMAIL_PORT      = {settings.EMAIL_PORT}")
        self.stdout.write(f"  EMAIL_HOST_USER = {settings.EMAIL_HOST_USER}")
        masked = "***" + (settings.EMAIL_HOST_PASSWORD or "")[-4:] if settings.EMAIL_HOST_PASSWORD else "(vide)"
        self.stdout.write(f"  EMAIL_HOST_PASSWORD = {masked}")
        self.stdout.write(f"  EMAIL_USE_TLS   = {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"  DEFAULT_FROM_EMAIL = {settings.DEFAULT_FROM_EMAIL}")
        self.stdout.write("")

        if "console" in settings.EMAIL_BACKEND:
            self.stdout.write(self.style.WARNING(
                "⚠ Backend = console. L'email sera juste affiché dans les logs Docker.\n"
                "  Pour envoyer en vrai, mettez dans .env.prod :\n"
                "    EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend\n"
                "    EMAIL_HOST_PASSWORD=<votre clé SendGrid>\n"
            ))

        body = (
            "Ceci est un email de test depuis Nakoa.\n\n"
            "Si vous recevez ce message, la configuration SMTP fonctionne correctement.\n\n"
            f"From   : {settings.DEFAULT_FROM_EMAIL}\n"
            f"Server : {settings.EMAIL_HOST}:{settings.EMAIL_PORT}\n"
            f"TLS    : {settings.EMAIL_USE_TLS}\n\n"
            "— Nakoa (Imprimer commence ici)"
        )

        self.stdout.write(f"Envoi vers {to}…")
        try:
            sent = send_mail(
                subject=subject,
                message=body,
                from_email=None,  # utilise DEFAULT_FROM_EMAIL
                recipient_list=[to],
                fail_silently=False,
            )
            if sent:
                self.stdout.write(self.style.SUCCESS(f"✓ Email envoyé à {to} (compteur Django : {sent})"))
                # Détecte le provider pour des conseils ciblés
                host = (settings.EMAIL_HOST or "").lower()
                self.stdout.write("  Vérifiez votre boîte de réception (et le dossier spam !).")
                self.stdout.write("  Si rien ne vient sous 2 minutes, vérifiez :")
                if "hostinger" in host:
                    self.stdout.write(
                        "  - Boîte email Hostinger active dans hPanel → Emails → Comptes Email\n"
                        "  - DNS SPF présent (dig TXT votredomaine.com | grep spf)\n"
                        "  - Logs Hostinger : hPanel → Emails → Outils → Logs"
                    )
                elif "sendgrid" in host:
                    self.stdout.write(
                        "  - Sender Authentication SendGrid (domaine ou Single Sender vérifié)\n"
                        "  - Quota SendGrid (100/jour en gratuit)\n"
                        "  - Logs SendGrid sur https://app.sendgrid.com/email_activity"
                    )
                elif "brevo" in host or "sendinblue" in host:
                    self.stdout.write(
                        "  - Sender autorisé dans Brevo (Senders, Domains & Dedicated IPs)\n"
                        "  - Logs Brevo : Statistics → Email Activity"
                    )
                elif "mailgun" in host:
                    self.stdout.write(
                        "  - Domaine vérifié dans Mailgun (SPF + DKIM)\n"
                        "  - Logs Mailgun : Sending → Logs"
                    )
                else:
                    self.stdout.write(
                        "  - Authentification SMTP correcte\n"
                        "  - DNS SPF/DKIM bien configurés\n"
                        "  - Logs de votre provider"
                    )
            else:
                self.stdout.write(self.style.ERROR("✗ Aucun email envoyé (send_mail retourne 0)."))
        except Exception as exc:  # noqa: BLE001
            self.stdout.write(self.style.ERROR(f"✗ Échec SMTP : {exc}"))
            self.stdout.write(self.style.WARNING(
                "\nCauses fréquentes :\n"
                "  - API key invalide ou expirée → régénérer sur SendGrid\n"
                "  - Sender non vérifié → vérifier le domaine ou créer Single Sender\n"
                "  - Port bloqué par le firewall → ouvrir 587 sortant\n"
                "  - TLS/SSL mal configuré → EMAIL_USE_TLS=True / EMAIL_USE_SSL=False pour port 587\n"
            ))
            raise CommandError("Test SMTP échoué") from exc
