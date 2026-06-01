"""Factories pour le catalogue produits."""

from __future__ import annotations

import factory
from factory.django import DjangoModelFactory
from django.utils.text import slugify

from .models import Category, Product, ProductOption, ProductOptionValue


class CategoryFactory(DjangoModelFactory):
    class Meta:
        model = Category
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Catégorie {n}")
    slug = factory.LazyAttribute(lambda o: slugify(o.name))
    description = factory.Faker("paragraph", locale="fr_FR")
    is_active = True
    position = factory.Sequence(lambda n: n)


class ProductFactory(DjangoModelFactory):
    class Meta:
        model = Product
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Produit {n}")
    slug = factory.LazyAttribute(lambda o: slugify(o.name))
    short_description = factory.Faker("sentence", locale="fr_FR")
    description = factory.Faker("paragraph", nb_sentences=5, locale="fr_FR")
    min_quantity = 100
    max_quantity = 50000
    lead_time_days = 3
    is_active = True
    is_featured = False
    sort_order = factory.Sequence(lambda n: n)
    tags = factory.LazyFunction(list)


class ProductOptionFactory(DjangoModelFactory):
    class Meta:
        model = ProductOption

    kind = ProductOption.Kind.FORMAT
    name = "Format"
    required = True
    position = 0


class ProductOptionValueFactory(DjangoModelFactory):
    class Meta:
        model = ProductOptionValue

    code = factory.Sequence(lambda n: f"opt-{n}")
    label = factory.LazyAttribute(lambda o: o.code.upper())
    extra_cost_pct = 0
    extra_cost_amount = 0
    position = factory.Sequence(lambda n: n)
