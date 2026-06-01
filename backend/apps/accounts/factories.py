"""Factories factory_boy pour les utilisateurs PrintHub."""

from __future__ import annotations

import factory
from django.contrib.auth import get_user_model
from factory.django import DjangoModelFactory
from faker import Faker

from .models import Role, UserAddress, UserPreferences

User = get_user_model()
fake = Faker(["fr_FR"])


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("email",)

    email = factory.LazyAttribute(lambda _: fake.unique.email())
    first_name = factory.LazyAttribute(lambda _: fake.first_name())
    last_name = factory.LazyAttribute(lambda _: fake.last_name())
    phone = factory.LazyAttribute(lambda _: f"+225{fake.unique.msisdn()[:8]}")
    primary_role = Role.CUSTOMER
    country = "CI"
    locale = "fr"
    is_email_verified = True
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "Printhub2026!")
        user = model_class.objects.create_user(password=password, **kwargs)
        return user


class CustomerFactory(UserFactory):
    primary_role = Role.CUSTOMER
    kyc_level = 2


class CorporateCustomerFactory(UserFactory):
    primary_role = Role.CUSTOMER_CORPORATE
    kyc_level = 3


class PrinterOwnerFactory(UserFactory):
    primary_role = Role.PRINTER
    kyc_level = 4
    is_phone_verified = True


class PrinterAgentFactory(UserFactory):
    primary_role = Role.PRINTER_AGENT


class CourierFactory(UserFactory):
    primary_role = Role.COURIER
    is_phone_verified = True


class AdminFactory(UserFactory):
    primary_role = Role.ADMIN
    is_staff = True
    is_phone_verified = True
    two_factor_enabled = True


class SuperAdminFactory(UserFactory):
    primary_role = Role.SUPER_ADMIN
    is_staff = True
    is_superuser = True
    two_factor_enabled = True


class SupportFactory(UserFactory):
    primary_role = Role.SUPPORT
    is_staff = True


class UserAddressFactory(DjangoModelFactory):
    class Meta:
        model = UserAddress

    kind = UserAddress.Kind.SHIPPING
    full_name = factory.LazyAttribute(lambda o: f"{o.user.first_name} {o.user.last_name}")
    phone = factory.LazyAttribute(lambda o: o.user.phone)
    line1 = factory.LazyAttribute(lambda _: fake.street_address())
    city = "Abidjan"
    country = "CI"
    is_default = True


class UserPreferencesFactory(DjangoModelFactory):
    class Meta:
        model = UserPreferences
        django_get_or_create = ("user",)

    notify_email = True
    notify_sms = True
    notify_push = True
    notify_whatsapp = True
