"""Endpoints DRF pour les abonnements Web Push."""

from __future__ import annotations

import logging

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import WebPushSubscription
from .web_push import get_public_vapid_key, send_web_push

logger = logging.getLogger(__name__)


class WebPushSubscribeSerializer(serializers.Serializer):
    endpoint = serializers.URLField(max_length=2048)
    p256dh = serializers.CharField(max_length=255)
    auth = serializers.CharField(max_length=255)
    label = serializers.CharField(max_length=120, required=False, allow_blank=True)


# ============================================================
# GET /api/v1/notifications/push/public-key/
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def public_key(request):
    """Retourne la clé publique VAPID pour que le navigateur s'abonne."""
    key = get_public_vapid_key()
    if not key:
        return Response(
            {"detail": "Push non configuré sur le serveur."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response({"public_key": key})


# ============================================================
# POST /api/v1/notifications/push/subscribe/
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def subscribe(request):
    """Enregistre une souscription Web Push pour l'utilisateur courant."""
    serializer = WebPushSubscribeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    sub, _ = WebPushSubscription.objects.update_or_create(
        endpoint=data["endpoint"],
        defaults={
            "user": request.user,
            "p256dh": data["p256dh"],
            "auth": data["auth"],
            "label": data.get("label", "") or "",
            "user_agent": request.META.get("HTTP_USER_AGENT", "")[:500],
            "is_active": True,
            "failure_count": 0,
        },
    )
    return Response({"id": str(sub.id), "is_active": sub.is_active})


# ============================================================
# POST /api/v1/notifications/push/unsubscribe/
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    """Désactive une souscription par endpoint."""
    endpoint = request.data.get("endpoint")
    if not endpoint:
        return Response({"detail": "endpoint requis."}, status=400)
    WebPushSubscription.objects.filter(user=request.user, endpoint=endpoint).update(
        is_active=False
    )
    return Response({"ok": True})


# ============================================================
# POST /api/v1/notifications/push/test/
# ============================================================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def test_push(request):
    """Envoie une notification test à tous les appareils actifs de l'utilisateur."""
    payload = {
        "title": request.data.get("title") or "Nakoa — test",
        "body": request.data.get("body") or "Notification de test envoyée depuis le serveur.",
        "icon": "/icon-192.png",
        "badge": "/icon-72.png",
        "data": {"url": "/notifications"},
    }
    subs = WebPushSubscription.objects.filter(user=request.user, is_active=True)
    success = 0
    errors: list[str] = []
    for sub in subs:
        ok, err = send_web_push(sub, payload)
        if ok:
            success += 1
        elif err:
            errors.append(err)
    return Response({
        "delivered": success,
        "subscriptions_total": subs.count(),
        "errors": errors,
    })
