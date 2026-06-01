"""Endpoint PrintHub Care — ouverture réclamation client + résolution admin."""

from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.core.exceptions import BusinessRuleViolation

from .models import Order
from .services_care import (
    care_deadline,
    is_care_eligible,
    open_care_claim,
    resolve_care_claim,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def care_status(request, order_id):
    """Statut d'éligibilité PrintHub Care pour une commande."""
    order = get_object_or_404(Order, id=order_id)
    if order.customer != request.user and not request.user.is_staff:
        return Response({"detail": "forbidden"}, status=403)
    deadline = care_deadline(order)
    return Response({
        "eligible": is_care_eligible(order),
        "deadline": deadline.isoformat() if deadline else None,
        "claim_open": order.status == "disputed",
        "previous_claims": order.metadata.get("care_claims", []),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def open_claim(request, order_id):
    """Le client ouvre une réclamation PrintHub Care (qualité)."""
    order = get_object_or_404(Order, id=order_id, customer=request.user)
    reason = request.data.get("reason", "").strip()
    photos = request.data.get("photos", [])
    if not reason or len(reason) < 10:
        raise BusinessRuleViolation("Veuillez décrire le problème en au moins 10 caractères.")
    result = open_care_claim(order=order, reason=reason, photos=photos)
    return Response(result, status=201)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def resolve_claim(request, order_id):
    """L'admin résout une réclamation."""
    order = get_object_or_404(Order, id=order_id)
    resolution = request.data.get("resolution")
    refund_amount = request.data.get("refund_amount")
    if resolution not in ("full_refund", "partial_refund", "reprint", "rejected"):
        raise BusinessRuleViolation("Résolution invalide.")
    from decimal import Decimal
    amount = Decimal(str(refund_amount)) if refund_amount else None
    result = resolve_care_claim(order=order, resolution=resolution, refund_amount=amount)
    return Response(result)
