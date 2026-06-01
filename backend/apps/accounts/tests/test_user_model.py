"""Tests du modèle User custom."""

import pytest


@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        from apps.accounts.models import User
        user = User.objects.create_user(email="test@example.com", password="Pwd123!@#")
        assert user.email == "test@example.com"
        assert user.is_active
        assert not user.is_staff
        assert not user.is_superuser
        assert user.kyc_level == 0

    def test_create_superuser(self):
        from apps.accounts.models import User, Role
        admin = User.objects.create_superuser(email="admin@example.com", password="Pwd123!@#")
        assert admin.is_staff
        assert admin.is_superuser
        assert admin.primary_role == Role.SUPER_ADMIN
        assert admin.is_email_verified

    def test_full_name_fallback(self):
        from apps.accounts.factories import CustomerFactory
        user = CustomerFactory(first_name="", last_name="")
        assert user.full_name == user.email

    def test_is_locked(self):
        from datetime import timedelta
        from django.utils import timezone
        from apps.accounts.factories import CustomerFactory
        user = CustomerFactory(locked_until=timezone.now() + timedelta(minutes=10))
        assert user.is_locked
        user.locked_until = timezone.now() - timedelta(minutes=1)
        assert not user.is_locked

    def test_role_helpers(self):
        from apps.accounts.factories import (
            CustomerFactory, PrinterOwnerFactory, CourierFactory, AdminFactory,
        )
        assert CustomerFactory().is_customer
        assert PrinterOwnerFactory().is_printer
        assert not CustomerFactory().is_printer
        assert not PrinterOwnerFactory().is_customer
