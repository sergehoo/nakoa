"""Seed initial du Revenue Engine.

Crée :
- les 13 sources de revenu de base (un par RevenueSource.Kind)
- une MonetizationConfig par défaut (singleton)
- 3 règles de commission d'exemple : Premium imprimeurs, Grosses commandes, Standard
"""

from __future__ import annotations

from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.revenue_engine.models import (
    CommissionRule,
    MonetizationConfig,
    RevenueSource,
)


DEFAULT_SOURCES = [
    {"code": "commission",            "kind": "commission",            "label": "Commission marketplace",  "icon": "Percent",       "sort_order": 10},
    {"code": "subscription",          "kind": "subscription",          "label": "Abonnements SaaS",        "icon": "CreditCard",    "sort_order": 20},
    {"code": "advertising",           "kind": "advertising",           "label": "Publicité sponsorisée",   "icon": "Megaphone",     "sort_order": 30},
    {"code": "premium_service",       "kind": "premium_service",       "label": "Services premium",        "icon": "Sparkles",      "sort_order": 40},
    {"code": "ai",                    "kind": "ai",                    "label": "IA premium",              "icon": "Brain",         "sort_order": 50},
    {"code": "api",                   "kind": "api",                   "label": "API premium",             "icon": "Plug",          "sort_order": 60},
    {"code": "delivery",              "kind": "delivery",              "label": "Livraison",               "icon": "Truck",         "sort_order": 70},
    {"code": "insurance",             "kind": "insurance",             "label": "Assurance commande",      "icon": "ShieldCheck",   "sort_order": 80},
    {"code": "financing",             "kind": "financing",             "label": "Financement / BNPL",      "icon": "Banknote",      "sort_order": 90},
    {"code": "escrow",                "kind": "escrow",                "label": "Escrow",                  "icon": "Lock",          "sort_order": 100},
    {"code": "graphics_marketplace",  "kind": "graphics_marketplace",  "label": "Marketplace graphique",   "icon": "Palette",       "sort_order": 110},
    {"code": "business_intelligence", "kind": "business_intelligence", "label": "Business Intelligence",   "icon": "BarChart3",     "sort_order": 120},
    {"code": "other",                 "kind": "other",                 "label": "Autre",                   "icon": "MoreHorizontal", "sort_order": 200},
]


class Command(BaseCommand):
    help = "Initialise le Revenue Engine (sources + config + règles d'exemple)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-examples", action="store_true",
            help="Crée aussi 3 règles de commission d'exemple.",
        )

    def handle(self, *args, with_examples: bool = False, **opts):
        # ---- Sources de revenu ----
        created = 0
        for payload in DEFAULT_SOURCES:
            _, was_created = RevenueSource.objects.update_or_create(
                code=payload["code"],
                defaults={
                    "kind": payload["kind"],
                    "label": payload["label"],
                    "icon": payload["icon"],
                    "sort_order": payload["sort_order"],
                    "is_enabled": True,
                },
            )
            created += int(was_created)
        self.stdout.write(self.style.SUCCESS(
            f"✓ {len(DEFAULT_SOURCES)} sources sync ({created} créées)"
        ))

        # ---- Configuration globale ----
        config = MonetizationConfig.get_solo()
        self.stdout.write(self.style.SUCCESS(
            f"✓ MonetizationConfig OK — commission par défaut {config.default_commission_rate * 100}%"
        ))

        # ---- Règles d'exemple ----
        if with_examples:
            commission_source = RevenueSource.objects.get(code="commission")

            CommissionRule.objects.update_or_create(
                name="Imprimeurs premium — taux réduit",
                defaults={
                    "source": commission_source,
                    "description": "Les imprimeurs premium bénéficient d'une commission de 5%.",
                    "is_active": True,
                    "conditions": {"fact": "printer.is_premium", "op": "eq", "value": True},
                    "calculation_type": CommissionRule.CalculationType.PERCENTAGE,
                    "percentage": Decimal("0.05"),
                    "priority": 10,
                    "stacking": CommissionRule.Stacking.STOP_ON_MATCH,
                },
            )
            CommissionRule.objects.update_or_create(
                name="Grosses commandes (>500k XOF) — 6%",
                defaults={
                    "source": commission_source,
                    "description": "Au-dessus de 500 000 XOF, on baisse à 6% pour fidéliser.",
                    "is_active": True,
                    "conditions": {
                        "all": [
                            {"fact": "order.total", "op": "gt", "value": 500000},
                            {"fact": "order.currency", "op": "eq", "value": "XOF"},
                        ]
                    },
                    "calculation_type": CommissionRule.CalculationType.PERCENTAGE,
                    "percentage": Decimal("0.06"),
                    "priority": 20,
                    "stacking": CommissionRule.Stacking.STOP_ON_MATCH,
                },
            )
            CommissionRule.objects.update_or_create(
                name="Commission standard 8%",
                defaults={
                    "source": commission_source,
                    "description": "Règle par défaut, s'applique si aucune autre ne matche.",
                    "is_active": True,
                    "conditions": {},  # match toujours
                    "calculation_type": CommissionRule.CalculationType.PERCENTAGE,
                    "percentage": Decimal("0.08"),
                    "min_commission": Decimal("500"),
                    "priority": 1000,
                    "stacking": CommissionRule.Stacking.STOP_ON_MATCH,
                },
            )
            self.stdout.write(self.style.SUCCESS("✓ 3 règles d'exemple créées"))

        self.stdout.write(self.style.SUCCESS("Revenue Engine prêt."))
