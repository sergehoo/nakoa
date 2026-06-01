"""Factories pour les abonnements."""

from __future__ import annotations

from decimal import Decimal

import factory
from factory.django import DjangoModelFactory

from .models import Plan, Subscription


class PlanFactory(DjangoModelFactory):
    class Meta:
        model = Plan
        django_get_or_create = ("tier",)

    tier = Plan.Tier.BASIC
    name = "Basic"
    description = "Plan d'entrée — démarrer sur PrintHub"
    monthly_price = Decimal("0")
    yearly_price = Decimal("0")
    currency = "XOF"
    commission_pct = Decimal("15")
    max_active_orders = 10
    max_team_members = 2
    max_products = 20
    ai_messages_per_month = 50
    is_active = True


class SubscriptionFactory(DjangoModelFactory):
    class Meta:
        model = Subscription

    cycle = Subscription.BillingCycle.MONTHLY
    status = Subscription.Status.ACTIVE
    auto_renew = True
