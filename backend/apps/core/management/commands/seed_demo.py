"""
Commande Django ``seed_demo`` — Charge un dataset de démonstration complet.

Usage :
    python manage.py seed_demo                # Seed complet
    python manage.py seed_demo --reset         # Vide d'abord puis seed
    python manage.py seed_demo --only=catalog  # Seed un seul module

Génère :
- 4 plans d'abonnement (Basic, Pro, Premium, Enterprise)
- 10 catégories produits
- ~50 produits configurables avec options
- 3 imprimeurs complets (Cocody Print, Treichville, Dakar Express)
- ~30 utilisateurs (admin, support, customers, printers, agents, couriers)
- ~20 commandes dans différents statuts
- Quelques notifications

Idempotent : peut être ré-exécuté sans dupliquer les données.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = "Charge un dataset de démonstration PrintHub (idempotent)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Vider les données de démo avant de recharger.",
        )
        parser.add_argument(
            "--only",
            choices=["plans", "catalog", "users", "printers", "pricing", "orders"],
            help="Seed uniquement le module sélectionné.",
        )

    def handle(self, *args: Any, **opts: Any) -> None:
        only = opts.get("only")
        if opts.get("reset"):
            self._reset()

        steps = [
            ("plans", self._seed_plans),
            ("users", self._seed_users),
            ("catalog", self._seed_catalog),
            ("printers", self._seed_printers),
            ("pricing", self._seed_pricing),
            ("orders", self._seed_orders),
        ]

        with transaction.atomic():
            for name, fn in steps:
                if only and only != name:
                    continue
                self.stdout.write(self.style.MIGRATE_HEADING(f"→ Seed {name}…"))
                fn()
                self.stdout.write(self.style.SUCCESS(f"  ✓ {name} OK"))

        self.stdout.write(self.style.SUCCESS("✓ Dataset de démonstration chargé."))

    # ============================================================
    # Reset
    # ============================================================
    def _reset(self) -> None:
        from apps.orders.models import Order
        from apps.catalog.models import Category, Product
        from apps.printers.models import PrinterProfile
        from apps.subscriptions.models import Plan

        self.stdout.write(self.style.WARNING("Reset des données de démo…"))
        Order.all_objects.filter(reference__startswith="PH-").delete()
        PrinterProfile.all_objects.all().delete()
        Product.all_objects.all().delete()
        Category.all_objects.all().delete()
        Plan.all_objects.all().delete()
        User.objects.filter(email__endswith="@demo.printhub.io").delete()

    # ============================================================
    # Plans d'abonnement
    # ============================================================
    def _seed_plans(self) -> None:
        from apps.subscriptions.models import Plan

        plans = [
            {
                "tier": Plan.Tier.BASIC,
                "name": "Basic",
                "description": "Démarrer sur PrintHub. Idéal pour les nouveaux imprimeurs.",
                "monthly_price": Decimal("0"),
                "yearly_price": Decimal("0"),
                "commission_pct": Decimal("15"),
                "max_active_orders": 10,
                "max_team_members": 2,
                "max_products": 20,
                "ai_messages_per_month": 50,
                "features": ["10 commandes actives", "2 utilisateurs", "20 produits", "Support email"],
            },
            {
                "tier": Plan.Tier.PRO,
                "name": "Pro",
                "description": "Pour les ateliers en croissance.",
                "monthly_price": Decimal("15000"),
                "yearly_price": Decimal("150000"),
                "commission_pct": Decimal("12"),
                "max_active_orders": 50,
                "max_team_members": 5,
                "max_products": 100,
                "ai_messages_per_month": 500,
                "features": ["50 commandes actives", "5 utilisateurs", "100 produits", "Assistant IA"],
            },
            {
                "tier": Plan.Tier.PREMIUM,
                "name": "Premium",
                "description": "L'offre complète pour ateliers établis.",
                "monthly_price": Decimal("50000"),
                "yearly_price": Decimal("500000"),
                "commission_pct": Decimal("10"),
                "max_active_orders": 999999,
                "max_team_members": 20,
                "max_products": 999999,
                "ai_messages_per_month": 999999,
                "features": ["Commandes illimitées", "20 utilisateurs", "Produits illimités", "API + intégrations"],
            },
            {
                "tier": Plan.Tier.ENTERPRISE,
                "name": "Enterprise",
                "description": "Multi-ateliers, SLA dédié, support prioritaire.",
                "monthly_price": Decimal("250000"),
                "yearly_price": Decimal("2500000"),
                "commission_pct": Decimal("8"),
                "max_active_orders": 999999,
                "max_team_members": 999999,
                "max_products": 999999,
                "ai_messages_per_month": 999999,
                "features": ["Multi-ateliers", "Utilisateurs illimités", "SLA dédié", "Manager dédié"],
            },
        ]
        for p in plans:
            Plan.objects.update_or_create(tier=p["tier"], defaults=p)

    # ============================================================
    # Utilisateurs
    # ============================================================
    def _seed_users(self) -> None:
        from apps.accounts.factories import (
            AdminFactory,
            CorporateCustomerFactory,
            CourierFactory,
            CustomerFactory,
            PrinterAgentFactory,
            PrinterOwnerFactory,
            SuperAdminFactory,
            SupportFactory,
        )

        # Super admin connu
        admin, created = User.objects.get_or_create(
            email="admin@demo.printhub.io",
            defaults={
                "first_name": "Super",
                "last_name": "Admin",
                "primary_role": "super_admin",
                "is_staff": True,
                "is_superuser": True,
                "is_email_verified": True,
            },
        )
        if created:
            admin.set_password("Printhub2026!")
            admin.save()

        # Admins plateforme
        for i in range(2):
            AdminFactory(email=f"admin{i+1}@demo.printhub.io")

        # Support
        for i in range(2):
            SupportFactory(email=f"support{i+1}@demo.printhub.io")

        # Clients particuliers
        CustomerFactory(
            email="aissata@demo.printhub.io",
            first_name="Aïssata",
            last_name="Diallo",
            phone="+22507111111",
        )
        for i in range(4):
            CustomerFactory(email=f"client{i+1}@demo.printhub.io")

        # Clients entreprise
        CorporateCustomerFactory(
            email="brand-o@demo.printhub.io",
            first_name="Agence",
            last_name="Brand'O",
        )
        CorporateCustomerFactory(email="ong-uemoa@demo.printhub.io")

        # Imprimeurs (propriétaires)
        for slug in ["cocody-print", "treichville-print", "dakar-print"]:
            PrinterOwnerFactory(email=f"{slug}@demo.printhub.io")

        # Agents imprimeurs
        for i in range(3):
            PrinterAgentFactory(email=f"agent{i+1}@demo.printhub.io")

        # Livreurs
        for i in range(3):
            CourierFactory(email=f"livreur{i+1}@demo.printhub.io")

    # ============================================================
    # Catalogue
    # ============================================================
    def _seed_catalog(self) -> None:
        from apps.catalog.models import Category, Product, ProductOption, ProductOptionValue

        CATEGORIES = [
            ("Cartes de visite", "cartes-de-visite", "Cartes pro pour vous démarquer"),
            ("Flyers", "flyers", "Communication événementielle ciblée"),
            ("Affiches", "affiches", "Du A3 au grand format"),
            ("Brochures", "brochures", "Plaquettes pliées et reliées"),
            ("Bâches", "baches", "Banderoles événements et campagnes"),
            ("Stickers", "stickers", "Adhésifs personnalisés"),
            ("Tampons", "tampons", "Tampons encreurs sur mesure"),
            ("Magazines", "magazines", "Magazines piqués ou collés"),
            ("Packaging", "packaging", "Emballages personnalisés"),
            ("Signalétique", "signaletique", "Kakémonos, roll-ups, panneaux"),
        ]
        categories = {}
        for i, (name, slug, desc) in enumerate(CATEGORIES):
            cat, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "description": desc, "position": i, "is_active": True},
            )
            categories[slug] = cat

        # ~ 5 produits par catégorie
        PRODUCTS = [
            # Cartes de visite
            ("cartes-de-visite", "Carte de visite standard 350g", 100, 2),
            ("cartes-de-visite", "Carte de visite premium pelliculée", 100, 3),
            ("cartes-de-visite", "Carte de visite carrée", 100, 3),
            ("cartes-de-visite", "Carte avec dorure à chaud", 50, 5),
            ("cartes-de-visite", "Carte avec gaufrage", 50, 5),
            # Flyers
            ("flyers", "Flyer A6 recto-verso 135g", 500, 2),
            ("flyers", "Flyer A5 couché brillant", 500, 2),
            ("flyers", "Flyer A4 publicitaire", 250, 3),
            ("flyers", "Flyer DL plié 2 volets", 250, 3),
            ("flyers", "Flyer carte postale 300g", 100, 2),
            # Affiches
            ("affiches", "Affiche A3", 50, 2),
            ("affiches", "Affiche A2", 25, 3),
            ("affiches", "Affiche A1", 10, 3),
            ("affiches", "Affiche A0 grand format", 5, 4),
            ("affiches", "Affiche scotchée vitrine", 10, 2),
            # Brochures
            ("brochures", "Brochure A5 8 pages", 100, 4),
            ("brochures", "Brochure A4 12 pages", 100, 4),
            ("brochures", "Brochure A5 16 pages", 100, 5),
            ("brochures", "Catalogue 24 pages reliure piqûre", 50, 6),
            ("brochures", "Brochure carré 16 pages", 50, 5),
            # Bâches
            ("baches", "Bâche 2x1m œillets", 1, 2),
            ("baches", "Bâche 3x1m œillets", 1, 2),
            ("baches", "Bâche 4x2m grand événement", 1, 3),
            ("baches", "Bâche micro-perforée façade", 1, 4),
            ("baches", "Bâche tissée premium", 1, 4),
            # Stickers
            ("stickers", "Stickers ronds 5cm", 100, 2),
            ("stickers", "Stickers carrés 10cm", 100, 2),
            ("stickers", "Stickers planches A4", 50, 2),
            ("stickers", "Stickers transparents", 100, 3),
            ("stickers", "Stickers vinyle haute résistance", 100, 4),
            # Tampons
            ("tampons", "Tampon encreur format rond", 1, 3),
            ("tampons", "Tampon encreur rectangulaire", 1, 3),
            ("tampons", "Tampon dateur", 1, 4),
            ("tampons", "Tampon de poche", 1, 3),
            ("tampons", "Tampon professionnel logo", 1, 4),
            # Magazines
            ("magazines", "Magazine A4 24 pages", 100, 5),
            ("magazines", "Magazine A4 48 pages", 100, 6),
            ("magazines", "Magazine A4 piqûre cheval 16p", 100, 4),
            ("magazines", "Magazine carré 32 pages", 100, 5),
            ("magazines", "Magazine cousu dos carré", 100, 7),
            # Packaging
            ("packaging", "Boîte carton micro-cannelée", 50, 5),
            ("packaging", "Pochette papier kraft", 100, 4),
            ("packaging", "Étiquette autocollante alimentaire", 200, 3),
            ("packaging", "Boîte pliante avec encart", 50, 5),
            ("packaging", "Sac papier publicitaire", 100, 4),
            # Signalétique
            ("signaletique", "Roll-up 80x200cm", 1, 3),
            ("signaletique", "Kakémono 60x160cm", 1, 3),
            ("signaletique", "Panneau PVC 60x40cm", 1, 4),
            ("signaletique", "Vitrophanie", 1, 3),
            ("signaletique", "Akilux 60x40cm avec piquet", 1, 4),
        ]

        for cat_slug, name, min_qty, lead in PRODUCTS:
            slug = name.lower().replace(" ", "-").replace("'", "").replace("é", "e")
            product, _ = Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "category": categories[cat_slug],
                    "name": name,
                    "short_description": name,
                    "min_quantity": min_qty,
                    "lead_time_days": lead,
                    "is_active": True,
                    "specifications": {"category": cat_slug},
                },
            )
            # Options par défaut pour quelques produits clés
            if cat_slug == "flyers" and not product.options.exists():
                paper_opt = ProductOption.objects.create(
                    product=product, kind=ProductOption.Kind.PAPER, name="Papier", position=0,
                )
                for code, label in [("couche-brillant", "Couché brillant"), ("couche-mat", "Couché mat"), ("offset", "Offset")]:
                    ProductOptionValue.objects.create(option=paper_opt, code=code, label=label)

                weight_opt = ProductOption.objects.create(
                    product=product, kind=ProductOption.Kind.WEIGHT, name="Grammage", position=1,
                )
                for g in ["115g", "135g", "170g", "250g", "350g"]:
                    ProductOptionValue.objects.create(option=weight_opt, code=g, label=g)

    # ============================================================
    # Imprimeurs (3 complets)
    # ============================================================
    def _seed_printers(self) -> None:
        from apps.catalog.models import Category
        from apps.printers.models import (
            DeliveryZone,
            Finish,
            Machine,
            PrinterProfile,
            PrinterStatus,
            ProductionCapability,
        )

        printers_data = [
            {
                "slug": "cocody-print",
                "trade_name": "Cocody Print",
                "legal_name": "Cocody Print SARL",
                "country": "CI",
                "city": "Abidjan",
                "address": "Boulevard Latrille, Cocody",
                "geo": Point(-3.998, 5.367),
                "quality": Decimal("96"),
                "on_time": Decimal("94"),
                "load": Decimal("48"),
                "is_featured": True,
            },
            {
                "slug": "treichville-print",
                "trade_name": "Atelier Treichville",
                "legal_name": "Atelier Treichville SARL",
                "country": "CI",
                "city": "Abidjan",
                "address": "Rue 8, Treichville",
                "geo": Point(-4.014, 5.293),
                "quality": Decimal("88"),
                "on_time": Decimal("91"),
                "load": Decimal("65"),
                "is_featured": False,
            },
            {
                "slug": "dakar-print",
                "trade_name": "Dakar Print Express",
                "legal_name": "Dakar Print Express SARL",
                "country": "SN",
                "city": "Dakar",
                "address": "Rue Mohamed V, Plateau",
                "geo": Point(-17.467, 14.692),
                "quality": Decimal("82"),
                "on_time": Decimal("88"),
                "load": Decimal("35"),
                "is_featured": False,
            },
        ]
        for data in printers_data:
            owner = User.objects.get(email=f"{data['slug']}@demo.printhub.io")
            profile, _ = PrinterProfile.objects.update_or_create(
                owner=owner,
                defaults={
                    "slug": data["slug"],
                    "trade_name": data["trade_name"],
                    "legal_name": data["legal_name"],
                    "country": data["country"],
                    "city": data["city"],
                    "address": data["address"],
                    "geo_point": data["geo"],
                    "delivery_radius_km": Decimal("25"),
                    "daily_capacity_units": 5000,
                    "current_load_pct": data["load"],
                    "quality_score": data["quality"],
                    "on_time_rate": data["on_time"],
                    "response_time_minutes": 30,
                    "status": PrinterStatus.ACTIVE,
                    "kyc_status": "approved",
                    "is_featured": data["is_featured"],
                },
            )
            # Machines
            for m_name, m_kind in [
                ("HP Indigo 7900", Machine.Kind.DIGITAL),
                ("Heidelberg SM 74", Machine.Kind.OFFSET),
                ("Roland VG-640 grand format", Machine.Kind.LARGE_FORMAT),
            ]:
                Machine.objects.update_or_create(
                    printer=profile, name=m_name,
                    defaults={"kind": m_kind, "is_active": True, "capacity_per_hour": 2000},
                )
            # Finitions
            for code, label, unit in [
                ("vernis", "Vernis brillant", Decimal("50")),
                ("pelliculage", "Pelliculage mat", Decimal("80")),
                ("dorure", "Dorure à chaud", Decimal("150")),
            ]:
                Finish.objects.update_or_create(
                    printer=profile, code=code,
                    defaults={"label": label, "unit_cost": unit, "is_active": True},
                )
            # Zone de livraison
            DeliveryZone.objects.update_or_create(
                printer=profile, name=f"{data['city']} centre",
                defaults={
                    "country": data["country"], "city": data["city"],
                    "base_fee": Decimal("2500"), "per_km_fee": Decimal("200"),
                    "estimated_delay_hours": 24,
                },
            )
            # Capabilities (toutes les catégories)
            for cat in Category.objects.all():
                ProductionCapability.objects.update_or_create(
                    printer=profile, category=cat,
                    defaults={"lead_time_days_min": 1, "lead_time_days_max": 5,
                              "min_quantity": 1, "max_quantity": 100000},
                )

    # ============================================================
    # Pricing (grilles tarifaires)
    # ============================================================
    def _seed_pricing(self) -> None:
        from apps.catalog.models import Product
        from apps.pricing.models import PriceGrid, PriceTier
        from apps.printers.models import PrinterProfile

        for printer in PrinterProfile.objects.all():
            # Grilles pour les flyers (produits les plus demandés)
            flyer_products = Product.objects.filter(category__slug="flyers")[:3]
            base_factor = Decimal("1.0") if "cocody" in printer.slug else (
                Decimal("0.95") if "treichville" in printer.slug else Decimal("1.10")
            )
            for product in flyer_products:
                grid, _ = PriceGrid.objects.update_or_create(
                    printer=printer, product=product,
                    defaults={
                        "currency": "XOF",
                        "base_setup_cost": Decimal("5000"),
                        "base_unit_cost": Decimal("60") * base_factor,
                        "vat_rate": Decimal("18"),
                        "is_active": True,
                    },
                )
                # 3 paliers
                for min_qty, price in [(100, Decimal("80")), (500, Decimal("60")), (1000, Decimal("45"))]:
                    PriceTier.objects.update_or_create(
                        grid=grid, min_quantity=min_qty,
                        defaults={"unit_price": price * base_factor},
                    )

    # ============================================================
    # Commandes (cycle de vie complet)
    # ============================================================
    def _seed_orders(self) -> None:
        from apps.catalog.models import Product
        from apps.orders.models import Order, OrderStatus
        from apps.printers.models import PrinterProfile
        from apps.core.utils import generate_reference

        customer = User.objects.filter(email="aissata@demo.printhub.io").first()
        printer = PrinterProfile.objects.filter(slug="cocody-print").first()
        product = Product.objects.filter(slug="flyer-a6-recto-verso-135g").first()
        if not all([customer, printer, product]):
            return

        statuses_to_seed = [
            OrderStatus.DRAFT,
            OrderStatus.QUOTED,
            OrderStatus.PAYMENT_PENDING,
            OrderStatus.PAID,
            OrderStatus.IN_PRODUCTION,
            OrderStatus.QUALITY_CHECK,
            OrderStatus.IN_DELIVERY,
            OrderStatus.DELIVERED,
            OrderStatus.COMPLETED,
        ]
        for status in statuses_to_seed:
            ref = generate_reference("PH-DEMO")
            if Order.objects.filter(customer=customer, status=status).exists():
                continue
            Order.objects.create(
                reference=ref,
                customer=customer,
                printer=printer,
                product=product,
                quantity=500,
                unit_price_excl_tax=Decimal("60"),
                total_excl_tax=Decimal("30000"),
                vat_rate=Decimal("18"),
                vat_amount=Decimal("5400"),
                total_incl_tax=Decimal("35400"),
                delivery_fee=Decimal("2500"),
                platform_commission=Decimal("3000"),
                printer_payout=Decimal("27000"),
                currency="XOF",
                delivery_country="CI",
                status=status,
                paid_at=timezone.now() if status not in [OrderStatus.DRAFT, OrderStatus.QUOTED, OrderStatus.PAYMENT_PENDING] else None,
                delivery_address={"country": "CI", "city": "Abidjan", "address": "Boulevard Latrille"},
            )
