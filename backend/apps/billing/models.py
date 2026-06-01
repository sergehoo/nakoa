"""Factures clients + commission imprimeur + exports comptables."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel, Country, Currency


class InvoiceType(models.TextChoices):
    SALES = "sales", _("Vente client")
    COMMISSION = "commission", _("Commission plateforme")
    SUBSCRIPTION = "subscription", _("Abonnement SaaS")
    CREDIT_NOTE = "credit_note", _("Avoir")


class InvoiceStatus(models.TextChoices):
    DRAFT = "draft", _("Brouillon")
    ISSUED = "issued", _("Émise")
    PAID = "paid", _("Payée")
    CANCELLED = "cancelled", _("Annulée")
    OVERDUE = "overdue", _("En retard")


class Invoice(BaseModel):
    number = models.CharField(max_length=32, unique=True)
    invoice_type = models.CharField(max_length=24, choices=InvoiceType.choices, default=InvoiceType.SALES)
    issued_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="invoices",
    )
    order = models.ForeignKey(
        "orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="invoices",
    )
    printer = models.ForeignKey(
        "printers.PrinterProfile", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="invoices",
    )
    issued_at = models.DateField()
    due_at = models.DateField()
    paid_at = models.DateTimeField(null=True, blank=True)

    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))
    vat_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    total = models.DecimalField(max_digits=15, decimal_places=2)

    status = models.CharField(max_length=16, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)
    pdf_url = models.URLField(blank=True)
    issuer_country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    metadata = models.JSONField(default=dict, blank=True)


class InvoiceLine(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="lines")
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1"))
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))
    amount = models.DecimalField(max_digits=15, decimal_places=2)
