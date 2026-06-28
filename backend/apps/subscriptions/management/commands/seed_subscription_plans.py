"""Seed initial des plans d'abonnement Nakoa.

Crée 4 plans imprimeur (Free, Pro, Business, Enterprise) + 2 plans entreprise.
Le Super Admin peut ensuite les éditer ou en créer d'autres depuis /a/subscriptions.
"""

from __future__ import annotations

from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.subscriptions.models import Plan


PLANS = [
    # ----- Imprimeurs -----
    {
        "tier": Plan.Tier.BASIC,
        "code": "printer-free",
        "name": "Free",
        "tagline": "Pour démarrer la marketplace.",
        "description": "Idéal pour tester Nakoa sans engagement.",
        "monthly_price": Decimal("0"),
        "yearly_price": Decimal("0"),
        "commission_pct": Decimal("12"),
        "max_active_orders": 5,
        "max_team_members": 1,
        "max_products": 10,
        "ai_messages_per_month": 20,
        "features": ["catalogue_base", "chat_client", "support_email"],
        "trial_days": 0,
        "target_role": Plan.TargetRole.PRINTER,
        "is_public": True, "is_active": True, "is_highlight": False,
        "sort_order": 10,
        "cta_label": "Commencer gratuitement",
    },
    {
        "tier": Plan.Tier.PRO,
        "code": "printer-pro",
        "name": "Pro",
        "tagline": "L'essentiel pour grandir.",
        "description": "Pour les ateliers qui veulent professionnaliser leur production.",
        "monthly_price": Decimal("15000"),
        "yearly_price": Decimal("150000"),
        "commission_pct": Decimal("9"),
        "max_active_orders": 50,
        "max_team_members": 5,
        "max_products": 100,
        "ai_messages_per_month": 200,
        "features": [
            "catalogue_etendu", "chat_client", "production_kanban",
            "statistiques", "ai_assistant", "support_prio",
        ],
        "trial_days": 14,
        "target_role": Plan.TargetRole.PRINTER,
        "is_public": True, "is_active": True, "is_highlight": True,
        "sort_order": 20,
        "cta_label": "Commencer mon essai",
        "quotas": {"api_requests_day": 500},
    },
    {
        "tier": Plan.Tier.PREMIUM,
        "code": "printer-business",
        "name": "Business",
        "tagline": "Plus d'IA, plus d'équipe.",
        "description": "Pour les imprimeurs qui veulent automatiser et scaler.",
        "monthly_price": Decimal("45000"),
        "yearly_price": Decimal("450000"),
        "commission_pct": Decimal("7"),
        "max_active_orders": 200,
        "max_team_members": 15,
        "max_products": 500,
        "ai_messages_per_month": 1000,
        "features": [
            "catalogue_illimite", "chat_client", "production_kanban",
            "statistiques_avancees", "ai_assistant_pro", "api_access",
            "white_label_partiel", "support_prio", "manager_dedie",
        ],
        "trial_days": 14,
        "target_role": Plan.TargetRole.PRINTER,
        "is_public": True, "is_active": True, "is_highlight": False,
        "sort_order": 30,
        "cta_label": "Passer en Business",
        "quotas": {"api_requests_day": 5000},
    },
    {
        "tier": Plan.Tier.ENTERPRISE,
        "code": "printer-enterprise",
        "name": "Enterprise",
        "tagline": "Sur mesure pour les grands groupes.",
        "description": "SLA dédié, hébergement isolé, custom workflows.",
        "monthly_price": Decimal("0"),  # sur devis
        "yearly_price": Decimal("0"),
        "commission_pct": Decimal("5"),
        "max_active_orders": 0,  # illimité
        "max_team_members": 0,
        "max_products": 0,
        "ai_messages_per_month": 0,
        "features": [
            "tout_business",
            "sla_dedie", "isolation_donnees", "sso", "audit_log",
            "manager_dedie", "support_24_7", "training",
        ],
        "trial_days": 0,
        "target_role": Plan.TargetRole.PRINTER,
        "is_public": True, "is_active": True, "is_highlight": False,
        "sort_order": 40,
        "cta_label": "Nous contacter",
        "quotas": {"api_requests_day": -1},  # illimité
    },

    # ----- Entreprises clientes -----
    {
        "tier": Plan.Tier.PRO,
        "code": "corporate-team",
        "name": "Team",
        "tagline": "Commandes récurrentes pour PME.",
        "description": "Centralise les commandes d'impression de votre équipe.",
        "monthly_price": Decimal("9000"),
        "yearly_price": Decimal("90000"),
        "commission_pct": Decimal("0"),
        "max_active_orders": 30,
        "max_team_members": 10,
        "max_products": 0,
        "ai_messages_per_month": 100,
        "features": [
            "facturation_b2b", "multi_utilisateurs", "bons_de_commande",
            "delais_paiement", "tableau_de_bord_equipe",
        ],
        "trial_days": 14,
        "target_role": Plan.TargetRole.CUSTOMER_CORPORATE,
        "is_public": True, "is_active": True, "is_highlight": True,
        "sort_order": 50,
        "cta_label": "Essayer 14 jours",
    },
    {
        "tier": Plan.Tier.PREMIUM,
        "code": "corporate-scale",
        "name": "Scale",
        "tagline": "Pour les grandes équipes marketing.",
        "description": "Multi-marques, multi-pays, API d'intégration.",
        "monthly_price": Decimal("29000"),
        "yearly_price": Decimal("290000"),
        "commission_pct": Decimal("0"),
        "max_active_orders": 200,
        "max_team_members": 100,
        "max_products": 0,
        "ai_messages_per_month": 1000,
        "features": [
            "facturation_b2b", "multi_utilisateurs", "multi_marques",
            "api_access", "sso_saml", "custom_branding",
            "manager_dedie", "support_prio",
        ],
        "trial_days": 14,
        "target_role": Plan.TargetRole.CUSTOMER_CORPORATE,
        "is_public": True, "is_active": True, "is_highlight": False,
        "sort_order": 60,
        "cta_label": "Demander une démo",
        "quotas": {"api_requests_day": 5000},
    },
]


class Command(BaseCommand):
    help = "Seed les plans d'abonnement par défaut de Nakoa."

    def handle(self, *args, **opts):
        created = updated = 0
        for payload in PLANS:
            code = payload["code"]
            obj, was_created = Plan.objects.update_or_create(code=code, defaults=payload)
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f"✓ Plans sync : {created} créés, {updated} mis à jour, {len(PLANS)} total."
        ))
