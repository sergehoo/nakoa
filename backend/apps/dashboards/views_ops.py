"""Endpoints Operations Center."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .services.ops_center import (
    compute_ai_monitoring,
    compute_ops_overview,
    compute_realtime_map,
    compute_war_room,
)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def ops_overview(request):
    """Vue d'ensemble temps réel pour exploitation."""
    return Response(compute_ops_overview())


@api_view(["GET"])
@permission_classes([IsAdminUser])
def ops_map(request):
    """Données carte temps réel (imprimeurs actifs avec position)."""
    return Response(compute_realtime_map())


@api_view(["GET"])
@permission_classes([IsAdminUser])
def ops_ai_monitoring(request):
    """Monitoring IA : fraude + SLA breaches."""
    return Response(compute_ai_monitoring())


@api_view(["GET"])
@permission_classes([IsAdminUser])
def war_room(request):
    """War Room stratégique — vue complète pour direction."""
    return Response(compute_war_room())
