"""Seed les 12 types de notifications standards Nakoa.

Couvre l'ensemble des événements listés dans le brief :
nouvelles commandes, nouveaux messages, validation BAT, paiements, production,
livraison, promotions, campagnes marketing, rappels, relances.
"""

from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.notifications.models import NotificationType


TYPES = [
    # ----- Transactionnel (notifs critiques métier) -----
    {
        "code": "order.new",
        "label": "Nouvelle commande",
        "description": "Une commande vient d'être placée (côté imprimeur) ou confirmée (côté client).",
        "category": NotificationType.Category.TRANSACTIONAL,
        "icon": "ShoppingCart",
        "default_channels": ["in_app", "push", "email"],
        "is_user_toggleable": True, "sort_order": 10,
    },
    {
        "code": "chat.new_message",
        "label": "Nouveau message",
        "description": "Un message dans une conversation client ↔ imprimeur.",
        "category": NotificationType.Category.TRANSACTIONAL,
        "icon": "MessageSquare",
        "default_channels": ["in_app", "push"],
        "is_user_toggleable": True, "sort_order": 20,
    },
    {
        "code": "bat.validation",
        "label": "Validation BAT",
        "description": "Un Bon À Tirer a été soumis ou validé.",
        "category": NotificationType.Category.TRANSACTIONAL,
        "icon": "FileCheck",
        "default_channels": ["in_app", "push", "email"],
        "is_user_toggleable": True, "sort_order": 30,
    },
    {
        "code": "payment.received",
        "label": "Paiement reçu",
        "description": "Un paiement vient d'être confirmé.",
        "category": NotificationType.Category.TRANSACTIONAL,
        "icon": "CreditCard",
        "default_channels": ["in_app", "push", "email"],
        "is_user_toggleable": True, "sort_order": 40,
    },
    {
        "code": "production.update",
        "label": "Avancement production",
        "description": "Étape de production mise à jour (impression, finition, contrôle qualité).",
        "category": NotificationType.Category.TRANSACTIONAL,
        "icon": "Factory",
        "default_channels": ["in_app", "push"],
        "is_user_toggleable": True, "sort_order": 50,
    },
    {
        "code": "delivery.update",
        "label": "Livraison",
        "description": "Expédition, en cours d'acheminement, livré, échec.",
        "category": NotificationType.Category.TRANSACTIONAL,
        "icon": "Truck",
        "default_channels": ["in_app", "push", "sms"],
        "is_user_toggleable": True, "sort_order": 60,
    },

    # ----- Sécurité / système -----
    {
        "code": "security.alert",
        "label": "Alerte sécurité",
        "description": "Connexion suspecte, changement de mot de passe, 2FA…",
        "category": NotificationType.Category.SECURITY,
        "icon": "ShieldAlert",
        "default_channels": ["in_app", "email"],
        "is_user_toggleable": False,  # forcé pour des raisons de sécurité
        "sort_order": 70,
    },
    {
        "code": "system.maintenance",
        "label": "Maintenance plateforme",
        "description": "Annonces de maintenance programmée ou indisponibilité.",
        "category": NotificationType.Category.SYSTEM,
        "icon": "Wrench",
        "default_channels": ["in_app", "email"],
        "is_user_toggleable": True, "sort_order": 80,
    },

    # ----- Marketing (opt-in fortement recommandé) -----
    {
        "code": "marketing.promo",
        "label": "Offres et promotions",
        "description": "Codes promo, ventes flash, nouveautés catalogue.",
        "category": NotificationType.Category.MARKETING,
        "icon": "Tag",
        "default_channels": ["in_app", "email"],
        "is_user_toggleable": True, "sort_order": 90,
    },
    {
        "code": "marketing.campaign",
        "label": "Campagnes marketing",
        "description": "Newsletter Nakoa, actualités, événements.",
        "category": NotificationType.Category.MARKETING,
        "icon": "Megaphone",
        "default_channels": ["email"],
        "is_user_toggleable": True, "sort_order": 100,
    },
    {
        "code": "reminder.cart",
        "label": "Rappels (panier, devis…)",
        "description": "Vous avez un devis non finalisé, un panier non payé, etc.",
        "category": NotificationType.Category.MARKETING,
        "icon": "Bell",
        "default_channels": ["email", "push"],
        "is_user_toggleable": True, "sort_order": 110,
    },
    {
        "code": "follow_up.review",
        "label": "Relances après commande",
        "description": "Demande d'avis, satisfaction, parrainage.",
        "category": NotificationType.Category.MARKETING,
        "icon": "Star",
        "default_channels": ["email"],
        "is_user_toggleable": True, "sort_order": 120,
    },
]


class Command(BaseCommand):
    help = "Seed les types de notifications par défaut de Nakoa."

    def handle(self, *args, **opts):
        created = updated = 0
        for payload in TYPES:
            _, was_created = NotificationType.objects.update_or_create(
                code=payload["code"], defaults=payload,
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f"✓ Types de notifications : {created} créés, {updated} mis à jour."
        ))
