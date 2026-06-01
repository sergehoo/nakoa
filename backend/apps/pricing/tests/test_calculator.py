"""Tests du PriceCalculator."""

from decimal import Decimal

import pytest


@pytest.mark.django_db
class TestPriceCalculator:
    def test_basic_quote(self, printer, product):
        from apps.pricing.factories import PriceGridFactory, PriceTierFactory
        from apps.pricing.services import PriceCalculator

        grid = PriceGridFactory(printer=printer, product=product, base_setup_cost=Decimal("5000"))
        PriceTierFactory(grid=grid, min_quantity=100, unit_price=Decimal("50"))
        result = PriceCalculator(grid).quote(quantity=500)

        assert result.subtotal == Decimal("25000.00")  # 500 × 50
        assert result.setup == Decimal("5000")
        assert result.total_excl_tax == Decimal("30000.00")
        assert result.unit_price == Decimal("60.00")  # (25000+5000)/500
        assert result.currency == "XOF"

    def test_vat_calculation(self, printer, product):
        from apps.pricing.factories import PriceGridFactory, PriceTierFactory
        from apps.pricing.services import PriceCalculator

        grid = PriceGridFactory(
            printer=printer, product=product,
            base_setup_cost=Decimal("0"), vat_rate=Decimal("18"),
        )
        PriceTierFactory(grid=grid, min_quantity=1, unit_price=Decimal("100"))
        result = PriceCalculator(grid).quote(quantity=100)

        assert result.total_excl_tax == Decimal("10000.00")
        assert result.vat == Decimal("1800.00")
        assert result.total_incl_tax == Decimal("11800.00")

    def test_discount(self, printer, product):
        from apps.pricing.factories import PriceGridFactory, PriceTierFactory
        from apps.pricing.services import PriceCalculator

        grid = PriceGridFactory(printer=printer, product=product, base_setup_cost=Decimal("0"))
        PriceTierFactory(grid=grid, min_quantity=1, unit_price=Decimal("100"))
        result = PriceCalculator(grid).quote(quantity=100, discount_pct=Decimal("10"))

        assert result.discount == Decimal("1000.00")  # 10% de 10000
        assert result.total_excl_tax == Decimal("9000.00")
