"""Modèle Order — agrégat racine du domaine PrintHub."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_fsm import FSMField, transition

from apps.core.models import BaseModel, Country, Currency


class OrderStatus(models.TextChoices):
    DRAFT = "draft", _("Brouillon")
    QUOTE_PENDING = "quote_pending", _("Devis en attente")
    QUOTED = "quoted", _("Devis disponible")
    BAT_UPLOADED = "bat_uploaded", _("BAT déposé")
    BAT_VALIDATED = "bat_validated", _("BAT validé")
    PAYMENT_PENDING = "payment_pending", _("Paiement en attente")
    PAID = "paid", _("Payée")
    ASSIGNED = "assigned", _("Attribuée imprimeur")
    ACCEPTED = "accepted", _("Acceptée par l'imprimeur")
    IN_PRODUCTION = "in_production", _("En production")
    QUALITY_CHECK = "quality_check", _("Contrôle qualité")
    READY_FOR_PICKUP = "ready_for_pickup", _("Prête pour expédition")
    IN_DELIVERY = "in_delivery", _("En livraison")
    DELIVERED = "delivered", _("Livrée")
    COMPLETED = "completed", _("Clôturée")
    CANCELLED = "cancelled", _("Annulée")
    DISPUTED = "disputed", _("En litige")
    REFUNDED = "refunded", _("Remboursée")


class Order(BaseModel):
    reference = models.CharField(max_length=24, unique=True, db_index=True)

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders",
    )
    customer_company = models.ForeignKey(
        "customers.CustomerCompany", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="orders",
    )
    printer = models.ForeignKey(
        "printers.PrinterProfile", null=True, blank=True,
        on_delete=models.PROTECT, related_name="orders",
    )

    quote_request = models.ForeignKey(
        "quote_requests.QuoteRequest", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="orders",
    )
    selected_offer = models.ForeignKey(
        "quote_requests.QuoteOffer", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="orders",
    )
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="orders")
    quantity = models.PositiveIntegerField()
    option_values = models.ManyToManyField("catalog.ProductOptionValue", blank=True)

    bat_document = models.ForeignKey(
        "documents.Document", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="bat_orders",
    )

    unit_price_excl_tax = models.DecimalField(max_digits=15, decimal_places=4)
    total_excl_tax = models.DecimalField(max_digits=15, decimal_places=2)
    vat_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("18"))
    vat_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    total_incl_tax = models.DecimalField(max_digits=15, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    platform_commission = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    printer_payout = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0"))
    currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)

    delivery_address = models.JSONField(default=dict, blank=True)
    delivery_country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    expected_delivery_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    status = FSMField(default=OrderStatus.DRAFT, choices=OrderStatus.choices, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    customer_notes = models.TextField(blank=True)
    printer_notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["customer", "status", "created_at"]),
            models.Index(fields=["printer", "status", "expected_delivery_at"]),
            models.Index(fields=["status", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.reference

    # ============================================================
    # FSM transitions
    # ============================================================
    @transition(field=status, source=[OrderStatus.DRAFT], target=OrderStatus.QUOTE_PENDING)
    def submit_quote(self):
        pass

    @transition(field=status, source=[OrderStatus.QUOTED, OrderStatus.DRAFT], target=OrderStatus.BAT_UPLOADED)
    def upload_bat(self):
        pass

    @transition(field=status, source=[OrderStatus.BAT_UPLOADED], target=OrderStatus.BAT_VALIDATED)
    def validate_bat(self):
        pass

    @transition(
        field=status,
        source=[OrderStatus.BAT_VALIDATED, OrderStatus.QUOTED],
        target=OrderStatus.PAYMENT_PENDING,
    )
    def request_payment(self):
        pass

    @transition(field=status, source=[OrderStatus.PAYMENT_PENDING], target=OrderStatus.PAID)
    def mark_paid(self):
        from django.utils import timezone
        self.paid_at = timezone.now()

    @transition(field=status, source=[OrderStatus.PAID], target=OrderStatus.ASSIGNED)
    def assign_printer(self):
        pass

    @transition(field=status, source=[OrderStatus.ASSIGNED], target=OrderStatus.ACCEPTED)
    def accept(self):
        from django.utils import timezone
        self.accepted_at = timezone.now()

    @transition(field=status, source=[OrderStatus.ACCEPTED], target=OrderStatus.IN_PRODUCTION)
    def start_production(self):
        pass

    @transition(field=status, source=[OrderStatus.IN_PRODUCTION], target=OrderStatus.QUALITY_CHECK)
    def to_quality_check(self):
        pass

    @transition(field=status, source=[OrderStatus.QUALITY_CHECK], target=OrderStatus.READY_FOR_PICKUP)
    def ready_pickup(self):
        pass

    @transition(field=status, source=[OrderStatus.READY_FOR_PICKUP], target=OrderStatus.IN_DELIVERY)
    def start_delivery(self):
        pass

    @transition(field=status, source=[OrderStatus.IN_DELIVERY], target=OrderStatus.DELIVERED)
    def deliver(self):
        from django.utils import timezone
        self.delivered_at = timezone.now()

    @transition(field=status, source=[OrderStatus.DELIVERED], target=OrderStatus.COMPLETED)
    def complete(self):
        pass

    @transition(
        field=status,
        source=[OrderStatus.DRAFT, OrderStatus.QUOTED, OrderStatus.BAT_UPLOADED,
                OrderStatus.BAT_VALIDATED, OrderStatus.PAYMENT_PENDING, OrderStatus.PAID,
                OrderStatus.ASSIGNED, OrderStatus.ACCEPTED],
        target=OrderStatus.CANCELLED,
    )
    def cancel(self, reason: str = ""):
        from django.utils import timezone
        self.cancelled_at = timezone.now()
        self.cancellation_reason = reason

    @transition(
        field=status,
        source=[OrderStatus.IN_PRODUCTION, OrderStatus.QUALITY_CHECK,
                OrderStatus.READY_FOR_PICKUP, OrderStatus.IN_DELIVERY,
                OrderStatus.DELIVERED],
        target=OrderStatus.DISPUTED,
    )
    def dispute(self):
        pass

    @transition(
        field=status,
        source=[OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.DISPUTED],
        target=OrderStatus.REFUNDED,
    )
    def refund(self):
        pass


class OrderStatusHistory(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=24)
    to_status = models.CharField(max_length=24)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="+",
    )
    note = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)


class OrderItem(BaseModel):
    """Pour les commandes multi-lignes éventuelles (multi-produits)."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=15, decimal_places=4)
    line_total = models.DecimalField(max_digits=15, decimal_places=2)
    specs = models.JSONField(default=dict, blank=True)
