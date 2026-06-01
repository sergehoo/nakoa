"""Tests du MatchingEngine v2."""

from decimal import Decimal

import pytest


@pytest.mark.django_db
class TestMatchingEngine:
    def test_no_eligible_printer_returns_empty(self, user, product):
        from apps.matching.services import MatchingEngine
        from apps.quote_requests.models import QuoteRequest

        qr = QuoteRequest.objects.create(
            reference="QR-TEST-1",
            customer=user,
            product=product,
            quantity=500,
            currency="XOF",
            delivery_country="CI",
        )
        offers = MatchingEngine(qr).run()
        assert offers == []

    def test_matching_creates_offers_with_tags(self, user, printer, product, category):
        from apps.matching.services import MatchingEngine
        from apps.pricing.factories import PriceGridFactory, PriceTierFactory
        from apps.printers.factories import PrinterProfileFactory
        from apps.printers.models import ProductionCapability
        from apps.quote_requests.models import QuoteRequest

        # Le produit doit être dans la même catégorie que la capability
        product.category = category
        product.save()
        ProductionCapability.objects.create(printer=printer, category=category)
        grid = PriceGridFactory(printer=printer, product=product, base_setup_cost=Decimal("0"))
        PriceTierFactory(grid=grid, min_quantity=1, unit_price=Decimal("100"))

        # Deuxième imprimeur pour avoir un comparatif
        printer2 = PrinterProfileFactory()
        ProductionCapability.objects.create(printer=printer2, category=category)
        grid2 = PriceGridFactory(printer=printer2, product=product, base_setup_cost=Decimal("0"))
        PriceTierFactory(grid=grid2, min_quantity=1, unit_price=Decimal("80"))

        qr = QuoteRequest.objects.create(
            reference="QR-TEST-2",
            customer=user,
            product=product,
            quantity=100,
            currency="XOF",
            delivery_country="CI",
        )
        offers = MatchingEngine(qr).run()
        assert len(offers) == 2
        # Au moins une offre recommandée IA
        assert any(o.is_ai_recommended for o in offers)
