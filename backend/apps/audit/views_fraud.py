"""Endpoints Fraud Engine."""

from dataclasses import asdict

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.printers.models import PrinterProfile

from .services.fraud_engine import (
    customer_trust_score,
    fraud_console_summary,
    order_risk_score,
    payment_risk_score,
    printer_trust_score,
)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def printer_score(request, printer_id):
    printer = get_object_or_404(PrinterProfile, id=printer_id)
    return Response(asdict(printer_trust_score(printer)))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def payment_score(request, payment_id):
    payment = get_object_or_404(Payment, id=payment_id)
    return Response(asdict(payment_risk_score(payment)))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def order_score(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    return Response(asdict(order_risk_score(order)))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def customer_score(request, customer_id):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = get_object_or_404(User, id=customer_id)
    return Response(asdict(customer_trust_score(user)))


@api_view(["GET"])
@permission_classes([IsAdminUser])
def console_summary(request):
    days = int(request.query_params.get("days", 7))
    return Response(fraud_console_summary(days))
