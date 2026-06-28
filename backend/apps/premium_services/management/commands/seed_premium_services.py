"""Seed des services premium par défaut (7 services + 3 catégories)."""

from __future__ import annotations

from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.premium_services.models import PremiumService, ServiceCategory


CATEGORIES = [
    {"slug": "graphique", "name": "Création graphique", "icon": "Palette", "sort_order": 10},
    {"slug": "preparation", "name": "Préparation fichiers", "icon": "FileCheck", "sort_order": 20},
    {"slug": "qualite", "name": "Qualité & contrôle", "icon": "ShieldCheck", "sort_order": 30},
]

SERVICES = [
    # Graphique
    {
        "code": "creation-graphique",
        "name": "Création graphique sur mesure",
        "short_description": "Un designer crée votre visuel from scratch.",
        "description": "Brief → moodboard → 3 propositions → 2 itérations → fichier print-ready.",
        "category_slug": "graphique",
        "pricing_type": "variable",
        "base_price": Decimal("25000"),
        "currency": "XOF",
        "icon": "Palette",
        "estimated_hours": 24,
        "sort_order": 10,
    },
    {
        "code": "retouche-photo",
        "name": "Retouche photo professionnelle",
        "short_description": "Détourage, colorimétrie, lumière.",
        "description": "Idéal pour photos produit, portraits, packaging.",
        "category_slug": "graphique",
        "pricing_type": "per_unit",
        "base_price": Decimal("3000"),
        "currency": "XOF",
        "icon": "Image",
        "estimated_hours": 4,
        "sort_order": 20,
    },
    # Préparation
    {
        "code": "correction-graphique",
        "name": "Correction graphique du fichier",
        "short_description": "Vérif fonds perdus, traits de coupe, polices.",
        "description": "Notre studio relit votre fichier et corrige les erreurs print bloquantes avant impression.",
        "category_slug": "preparation",
        "pricing_type": "fixed",
        "base_price": Decimal("5000"),
        "currency": "XOF",
        "icon": "Wand2",
        "estimated_hours": 2,
        "sort_order": 30,
    },
    {
        "code": "vectorisation",
        "name": "Vectorisation logo / illustration",
        "short_description": "PNG/JPG → vectoriel scalable.",
        "description": "Conversion en SVG/AI pour impression grand format sans pixellisation.",
        "category_slug": "preparation",
        "pricing_type": "fixed",
        "base_price": Decimal("8000"),
        "currency": "XOF",
        "icon": "Wand2",
        "estimated_hours": 4,
        "sort_order": 40,
    },
    {
        "code": "bat-pro",
        "name": "BAT professionnel signé",
        "short_description": "Bon à tirer haute qualité avec validation experte.",
        "description": "Épreuve calibrée + signature numérique. Engagement qualité.",
        "category_slug": "preparation",
        "pricing_type": "fixed",
        "base_price": Decimal("2500"),
        "currency": "XOF",
        "icon": "FileCheck",
        "estimated_hours": 2,
        "sort_order": 50,
    },
    # Qualité
    {
        "code": "controle-qualite-renforce",
        "name": "Contrôle qualité renforcé",
        "short_description": "Inspection minutieuse à 3 niveaux.",
        "description": "Avant, pendant et après production. Conformité au BAT garantie.",
        "category_slug": "qualite",
        "pricing_type": "percentage",
        "percentage": Decimal("0.03"),
        "base_price": Decimal("0"),
        "currency": "XOF",
        "icon": "ShieldCheck",
        "estimated_hours": 4,
        "sort_order": 60,
    },
    {
        "code": "optimisation-ia",
        "name": "Optimisation IA Nakoa",
        "short_description": "Notre IA optimise vos fichiers pour réduire les coûts.",
        "description": "Optimisation automatique des images, des marges, et suggestion de formats économiques.",
        "category_slug": "qualite",
        "pricing_type": "fixed",
        "base_price": Decimal("1500"),
        "currency": "XOF",
        "icon": "Sparkles",
        "estimated_hours": 1,
        "sort_order": 70,
    },
]


class Command(BaseCommand):
    help = "Seed les services premium par défaut."

    def handle(self, *args, **opts):
        cats: dict[str, ServiceCategory] = {}
        for payload in CATEGORIES:
            obj, _ = ServiceCategory.objects.update_or_create(
                slug=payload["slug"],
                defaults={
                    "name": payload["name"],
                    "icon": payload["icon"],
                    "sort_order": payload["sort_order"],
                    "is_active": True,
                },
            )
            cats[payload["slug"]] = obj
        self.stdout.write(self.style.SUCCESS(f"✓ {len(CATEGORIES)} catégories"))

        created = updated = 0
        for s in SERVICES:
            cat_slug = s.pop("category_slug")
            s["category"] = cats.get(cat_slug)
            obj, was_created = PremiumService.objects.update_or_create(
                code=s["code"], defaults=s,
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f"✓ Services : {created} créés, {updated} mis à jour."
        ))
