"""Pré-charge le catalogue Nakoa : catégories + produits standards d'imprimerie.

Usage :
    python manage.py seed_catalog
    python manage.py seed_catalog --reset  # vide les tables avant
"""

from __future__ import annotations

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.catalog.models import Category, Product, ProductOption, ProductOptionValue


# ============================================================================
# Catalogue complet
# Chaque catégorie regroupe ses produits.
# Chaque produit possède : nom, court desc, min_qty, lead_time, specs (json).
# Les options communes sont déclarées au niveau catégorie et instanciées par produit.
# ============================================================================

CATALOG = [
    # ────────────────────────────────────────────────────────────────────────
    {
        "name": "Impression papier",
        "slug": "impression-papier",
        "description": "Cartes de visite, flyers, brochures, papier à en-tête, etc.",
        "position": 1,
        "products": [
            {
                "name": "Cartes de visite",
                "short_description": "Cartes de visite professionnelles 85×55 mm",
                "min_quantity": 50,
                "lead_time_days": 3,
                "specs": {"finitions": ["mat", "brillant", "vernis_selectif"], "supports": ["350g", "400g"]},
            },
            {
                "name": "Flyers A6",
                "short_description": "Flyers format A6 (105×148 mm) — campagnes ciblées",
                "min_quantity": 100,
                "lead_time_days": 3,
                "specs": {"formats": ["A6"], "papiers": ["couché_115g", "couché_135g", "couché_170g"]},
            },
            {
                "name": "Flyers A5",
                "short_description": "Flyers format A5 (148×210 mm) — campagnes locales",
                "min_quantity": 100,
                "lead_time_days": 3,
            },
            {
                "name": "Flyers A4",
                "short_description": "Flyers format A4 (210×297 mm) — affichage commercial",
                "min_quantity": 50,
                "lead_time_days": 4,
            },
            {
                "name": "Affiches A3",
                "short_description": "Affiches grand format A3 (297×420 mm)",
                "min_quantity": 10,
                "lead_time_days": 3,
            },
            {
                "name": "Affiches A2",
                "short_description": "Affiches A2 (420×594 mm) — vitrines commerciales",
                "min_quantity": 5,
                "lead_time_days": 4,
            },
            {
                "name": "Brochures agrafées",
                "short_description": "Brochures A5 ou A4, 8 à 32 pages, dos piqué",
                "min_quantity": 50,
                "lead_time_days": 7,
            },
            {
                "name": "Brochures dos carré collé",
                "short_description": "Brochures premium, dos carré collé, 32-200 pages",
                "min_quantity": 50,
                "lead_time_days": 10,
            },
            {
                "name": "Dépliants 2 volets",
                "short_description": "Dépliants pliés en deux, format A4 ou A5",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
            {
                "name": "Dépliants 3 volets",
                "short_description": "Dépliants pliés roulé ou accordéon, format A4 ou A5",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
            {
                "name": "Catalogues",
                "short_description": "Catalogues produits, brochés, 16 à 200 pages",
                "min_quantity": 50,
                "lead_time_days": 12,
            },
            {
                "name": "Magazines",
                "short_description": "Magazines périodiques, papier couché, brochés",
                "min_quantity": 100,
                "lead_time_days": 10,
            },
            {
                "name": "Calendriers muraux",
                "short_description": "Calendriers muraux 12 mois, format A3 spirale",
                "min_quantity": 50,
                "lead_time_days": 7,
            },
            {
                "name": "Carnets",
                "short_description": "Carnets A5 ou A6, dos collé ou spirale, 80-200 pages",
                "min_quantity": 25,
                "lead_time_days": 7,
            },
            {
                "name": "Blocs-notes",
                "short_description": "Blocs-notes A4 ou A5, 50-100 feuillets, dos collé",
                "min_quantity": 50,
                "lead_time_days": 6,
            },
            {
                "name": "Enveloppes",
                "short_description": "Enveloppes DL, C5 ou C4 avec logo personnalisé",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
            {
                "name": "Papier à en-tête",
                "short_description": "Papier à en-tête A4 80g personnalisé",
                "min_quantity": 100,
                "lead_time_days": 4,
            },
        ],
    },
    # ────────────────────────────────────────────────────────────────────────
    {
        "name": "Grand format",
        "slug": "grand-format",
        "description": "Bâches, roll-up, kakémonos, panneaux, vinyles adhésifs.",
        "position": 2,
        "products": [
            {
                "name": "Bâches publicitaires",
                "short_description": "Bâches PVC 440g, œillets inclus, toutes dimensions",
                "min_quantity": 1,
                "lead_time_days": 4,
                "specs": {"supports": ["PVC 440g", "PVC 510g"], "finitions": ["œillets", "fourreau"]},
            },
            {
                "name": "Roll-up 85×200",
                "short_description": "Roll-up rétractable 85×200 cm avec sac de transport",
                "min_quantity": 1,
                "lead_time_days": 3,
            },
            {
                "name": "Roll-up 100×200",
                "short_description": "Roll-up 100×200 cm — événements et salons",
                "min_quantity": 1,
                "lead_time_days": 3,
            },
            {
                "name": "Kakémonos",
                "short_description": "Kakémonos suspendus tissu ou PVC",
                "min_quantity": 1,
                "lead_time_days": 4,
            },
            {
                "name": "Panneaux PVC",
                "short_description": "Panneaux PVC rigides 3mm ou 5mm",
                "min_quantity": 1,
                "lead_time_days": 4,
            },
            {
                "name": "Affiches grand format",
                "short_description": "Affiches A1 / A0 / 120×180 cm — papier ou bâche",
                "min_quantity": 5,
                "lead_time_days": 3,
            },
            {
                "name": "Vinyles adhésifs",
                "short_description": "Vinyles découpés ou imprimés pour véhicules et vitrines",
                "min_quantity": 1,
                "lead_time_days": 5,
            },
            {
                "name": "Adhésifs muraux",
                "short_description": "Stickers muraux décoratifs grand format",
                "min_quantity": 1,
                "lead_time_days": 4,
            },
            {
                "name": "Enseignes",
                "short_description": "Enseignes commerciales PVC / aluminium / lumineuses",
                "min_quantity": 1,
                "lead_time_days": 14,
            },
        ],
    },
    # ────────────────────────────────────────────────────────────────────────
    {
        "name": "Packaging & étiquettes",
        "slug": "packaging-etiquettes",
        "description": "Boîtes, sacs papier, étiquettes, stickers personnalisés.",
        "position": 3,
        "products": [
            {
                "name": "Boîtes carton personnalisées",
                "short_description": "Boîtes pliantes carton (cosmétique, alimentaire, e-commerce)",
                "min_quantity": 250,
                "lead_time_days": 14,
            },
            {
                "name": "Sacs papier",
                "short_description": "Sacs papier avec poignées (kraft, couché)",
                "min_quantity": 250,
                "lead_time_days": 12,
            },
            {
                "name": "Étiquettes adhésives",
                "short_description": "Étiquettes rouleau ou planche, formes libres",
                "min_quantity": 500,
                "lead_time_days": 6,
            },
            {
                "name": "Stickers carrés",
                "short_description": "Stickers vinyle découpé, divers formats",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
            {
                "name": "Stickers ronds",
                "short_description": "Stickers ronds personnalisés, vinyle ou papier",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
            {
                "name": "Emballages personnalisés",
                "short_description": "Emballages corporate (cartonnés, polyéthylène)",
                "min_quantity": 100,
                "lead_time_days": 14,
            },
            {
                "name": "Étiquettes textile",
                "short_description": "Étiquettes thermocollantes ou cousues",
                "min_quantity": 200,
                "lead_time_days": 10,
            },
        ],
    },
    # ────────────────────────────────────────────────────────────────────────
    {
        "name": "Communication visuelle",
        "slug": "communication-visuelle",
        "description": "Signalétique, PLV, stands, présentoirs, chevalets, plaques.",
        "position": 4,
        "products": [
            {
                "name": "Signalétique d'orientation",
                "short_description": "Panneaux directionnels intérieur/extérieur",
                "min_quantity": 1,
                "lead_time_days": 7,
            },
            {
                "name": "PLV comptoir",
                "short_description": "Présentoirs de comptoir carton ou PVC",
                "min_quantity": 5,
                "lead_time_days": 10,
            },
            {
                "name": "Stands parapluie",
                "short_description": "Stands déployables 3×3 m pour événements",
                "min_quantity": 1,
                "lead_time_days": 14,
            },
            {
                "name": "Présentoirs sol",
                "short_description": "Présentoirs sol carton ondulé personnalisés",
                "min_quantity": 10,
                "lead_time_days": 12,
            },
            {
                "name": "Chevalets",
                "short_description": "Chevalets PVC ou bois pour menus, signalisation",
                "min_quantity": 5,
                "lead_time_days": 6,
            },
            {
                "name": "Plaques professionnelles",
                "short_description": "Plaques alu, plexi ou inox pour entreprises",
                "min_quantity": 1,
                "lead_time_days": 10,
            },
        ],
    },
    # ────────────────────────────────────────────────────────────────────────
    {
        "name": "Textile & objets publicitaires",
        "slug": "textile-objets",
        "description": "T-shirts, polos, casquettes, mugs, stylos, tote bags, badges.",
        "position": 5,
        "products": [
            {
                "name": "T-shirts personnalisés",
                "short_description": "T-shirts coton avec impression sérigraphie ou transfert",
                "min_quantity": 20,
                "lead_time_days": 7,
            },
            {
                "name": "Polos brodés",
                "short_description": "Polos premium brodés, logo entreprise",
                "min_quantity": 20,
                "lead_time_days": 10,
            },
            {
                "name": "Casquettes brodées",
                "short_description": "Casquettes brodées 5 panneaux",
                "min_quantity": 50,
                "lead_time_days": 12,
            },
            {
                "name": "Mugs personnalisés",
                "short_description": "Mugs céramique avec impression sublimation",
                "min_quantity": 30,
                "lead_time_days": 7,
            },
            {
                "name": "Stylos publicitaires",
                "short_description": "Stylos billes ou métalliques marqués au logo",
                "min_quantity": 100,
                "lead_time_days": 10,
            },
            {
                "name": "Tote bags",
                "short_description": "Sacs en toile écologique personnalisés",
                "min_quantity": 50,
                "lead_time_days": 8,
            },
            {
                "name": "Badges & pin's",
                "short_description": "Badges, pin's métal émaillé pour événements",
                "min_quantity": 50,
                "lead_time_days": 14,
            },
            {
                "name": "Bracelets événementiels",
                "short_description": "Bracelets tissus ou silicone — accès événements",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
        ],
    },
    # ────────────────────────────────────────────────────────────────────────
    {
        "name": "Documents administratifs",
        "slug": "documents-administratifs",
        "description": "Facturiers, carnets autocopiants, tickets, formulaires, cartes PVC.",
        "position": 6,
        "products": [
            {
                "name": "Facturiers autocopiants",
                "short_description": "Facturiers 50 feuillets, 2 ou 3 exemplaires",
                "min_quantity": 5,
                "lead_time_days": 5,
            },
            {
                "name": "Reçus / bons",
                "short_description": "Bons de réception, carnets 50 feuillets",
                "min_quantity": 5,
                "lead_time_days": 5,
            },
            {
                "name": "Carnets autocopiants 3 feuillets",
                "short_description": "Devis, factures, bons de commande 3 feuillets",
                "min_quantity": 5,
                "lead_time_days": 6,
            },
            {
                "name": "Tickets numérotés",
                "short_description": "Tickets tombola ou accès, numérotation automatique",
                "min_quantity": 500,
                "lead_time_days": 4,
            },
            {
                "name": "Formulaires personnalisés",
                "short_description": "Formulaires administratifs format A4",
                "min_quantity": 100,
                "lead_time_days": 5,
            },
            {
                "name": "Certificats",
                "short_description": "Certificats / diplômes papier épais, dorure optionnelle",
                "min_quantity": 25,
                "lead_time_days": 5,
            },
            {
                "name": "Cartes PVC",
                "short_description": "Cartes PVC (membership, fidélité, badges nominatifs)",
                "min_quantity": 50,
                "lead_time_days": 7,
            },
        ],
    },
]


# Options de base que chaque produit hérite par défaut
DEFAULT_OPTIONS = {
    "format": {
        "kind": ProductOption.Kind.FORMAT,
        "name": "Format",
        "values": [
            {"code": "A6", "label": "A6 (105×148 mm)"},
            {"code": "A5", "label": "A5 (148×210 mm)"},
            {"code": "A4", "label": "A4 (210×297 mm)"},
            {"code": "A3", "label": "A3 (297×420 mm)"},
            {"code": "A2", "label": "A2 (420×594 mm)"},
            {"code": "A1", "label": "A1 (594×841 mm)"},
        ],
    },
    "papier": {
        "kind": ProductOption.Kind.PAPER,
        "name": "Papier",
        "values": [
            {"code": "couche_135g", "label": "Couché brillant 135g"},
            {"code": "couche_170g", "label": "Couché brillant 170g"},
            {"code": "couche_250g", "label": "Couché brillant 250g"},
            {"code": "couche_mat_300g", "label": "Couché mat 300g"},
            {"code": "offset_80g", "label": "Offset 80g"},
            {"code": "carton_350g", "label": "Carton 350g"},
            {"code": "carton_400g", "label": "Carton 400g"},
        ],
    },
    "finition": {
        "kind": ProductOption.Kind.FINISH,
        "name": "Finition",
        "values": [
            {"code": "aucune", "label": "Aucune"},
            {"code": "pelliculage_mat", "label": "Pelliculage mat"},
            {"code": "pelliculage_brillant", "label": "Pelliculage brillant"},
            {"code": "vernis_selectif", "label": "Vernis sélectif"},
            {"code": "dorure", "label": "Dorure à chaud"},
            {"code": "decoupe_forme", "label": "Découpe à la forme"},
        ],
    },
    "couleurs": {
        "kind": ProductOption.Kind.COLOR,
        "name": "Couleurs",
        "values": [
            {"code": "quadri_recto", "label": "Quadri recto"},
            {"code": "quadri_recto_verso", "label": "Quadri recto/verso"},
            {"code": "noir_recto", "label": "Noir recto"},
            {"code": "noir_recto_verso", "label": "Noir recto/verso"},
        ],
    },
}


class Command(BaseCommand):
    help = "Pré-charge le catalogue Nakoa (catégories + produits standards d'imprimerie)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime le catalogue existant avant de re-seeder.",
        )
        parser.add_argument(
            "--with-options",
            action="store_true",
            help="Ajoute les options communes (format, papier, finition, couleurs) à chaque produit.",
        )

    @transaction.atomic
    def handle(self, *args, **opts):
        if opts.get("reset"):
            self.stdout.write(self.style.WARNING("⚠ Suppression du catalogue existant…"))
            ProductOptionValue.objects.all().delete()
            ProductOption.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()

        created_cats = 0
        created_products = 0
        created_options = 0

        for cat_data in CATALOG:
            category, c_created = Category.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "description": cat_data.get("description", ""),
                    "position": cat_data.get("position", 0),
                    "is_active": True,
                },
            )
            if c_created:
                created_cats += 1
                self.stdout.write(self.style.SUCCESS(f"  ✓ Catégorie : {category.name}"))

            for p_data in cat_data["products"]:
                slug = slugify(p_data["name"])[:170]
                product, p_created = Product.objects.get_or_create(
                    slug=slug,
                    defaults={
                        "category": category,
                        "name": p_data["name"],
                        "short_description": p_data.get("short_description", ""),
                        "description": p_data.get("description", ""),
                        "min_quantity": p_data.get("min_quantity", 1),
                        "max_quantity": p_data.get("max_quantity", 1_000_000),
                        "lead_time_days": p_data.get("lead_time_days", 3),
                        "specifications": p_data.get("specs", {}),
                        "is_active": True,
                        "tags": p_data.get("tags", []),
                    },
                )
                if p_created:
                    created_products += 1

                # Ajout des options communes si demandé
                if opts.get("with_options") and p_created:
                    for opt_key, opt_data in DEFAULT_OPTIONS.items():
                        option = ProductOption.objects.create(
                            product=product,
                            kind=opt_data["kind"],
                            name=opt_data["name"],
                            required=(opt_key in {"format", "papier", "couleurs"}),
                        )
                        for i, v in enumerate(opt_data["values"]):
                            ProductOptionValue.objects.create(
                                option=option,
                                code=v["code"],
                                label=v["label"],
                                position=i,
                            )
                        created_options += 1

            self.stdout.write(
                f"    └─ {len(cat_data['products'])} produits dans « {category.name} »"
            )

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Seed terminé : "
            f"{created_cats} catégorie(s), {created_products} produit(s), {created_options} option(s)."
        ))
        self.stdout.write(self.style.SUCCESS(
            f"  Total catalogue : {Category.objects.count()} catégories · "
            f"{Product.objects.count()} produits."
        ))
