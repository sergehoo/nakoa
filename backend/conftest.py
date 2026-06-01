"""Configuration pytest racine — fixtures et plugins."""

import pytest
from django.core.management import call_command


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup, django_db_blocker):
    """Hook pour seeder des données minimales au démarrage des tests."""
    with django_db_blocker.unblock():
        pass


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return api_client


@pytest.fixture
def user(db):
    from apps.accounts.factories import CustomerFactory
    return CustomerFactory()


@pytest.fixture
def printer_owner(db):
    from apps.accounts.factories import PrinterOwnerFactory
    return PrinterOwnerFactory()


@pytest.fixture
def admin_user(db):
    from apps.accounts.factories import AdminFactory
    return AdminFactory()


@pytest.fixture
def category(db):
    from apps.catalog.factories import CategoryFactory
    return CategoryFactory()


@pytest.fixture
def product(db, category):
    from apps.catalog.factories import ProductFactory
    return ProductFactory(category=category)


@pytest.fixture
def printer(db, printer_owner):
    from apps.printers.factories import PrinterProfileFactory
    return PrinterProfileFactory(owner=printer_owner)


@pytest.fixture
def order(db, user, printer, product):
    from apps.orders.factories import OrderFactory
    return OrderFactory(customer=user, printer=printer, product=product)
