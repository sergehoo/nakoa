"""Endpoints de configuration et préférences de notifications."""

from __future__ import annotations

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Channel,
    NotificationType,
    UserNotificationPreference,
)


def _is_super_admin(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    role = getattr(user, "primary_role", "") or ""
    return role == "super_admin"


def _is_admin_staff(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    role = getattr(user, "primary_role", "") or ""
    return role in {"admin", "super_admin", "accountant", "support"}


# ============================================================
# Sérialiseurs
# ============================================================
class NotificationTypeSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = NotificationType
        fields = [
            "id", "code", "label", "description", "icon",
            "category", "category_label",
            "default_channels", "is_active", "is_user_toggleable",
            "sort_order",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "category_label", "created_at", "updated_at")

    def validate_default_channels(self, value):
        valid = {c[0] for c in Channel.choices}
        bad = [c for c in (value or []) if c not in valid]
        if bad:
            raise serializers.ValidationError(f"Canaux inconnus : {bad}")
        return value


class UserPreferenceSerializer(serializers.ModelSerializer):
    type_code = serializers.CharField(source="notification_type.code", read_only=True)
    type_label = serializers.CharField(source="notification_type.label", read_only=True)

    class Meta:
        model = UserNotificationPreference
        fields = [
            "id", "notification_type", "type_code", "type_label", "channels",
            "created_at", "updated_at",
        ]
        read_only_fields = ("id", "type_code", "type_label", "created_at", "updated_at")


# ============================================================
# ViewSets
# ============================================================
class NotificationTypeViewSet(viewsets.ModelViewSet):
    """CRUD des types de notification, Super Admin uniquement en écriture."""

    serializer_class = NotificationTypeSerializer
    queryset = NotificationType.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not _is_admin_staff(self.request.user):
            # Customer voit seulement les types qu'il peut configurer
            return NotificationType.objects.filter(is_active=True, is_user_toggleable=True)
        return super().get_queryset()

    def _check_super_admin(self):
        if not _is_super_admin(self.request.user):
            self.permission_denied(self.request, message="Réservé au Super Admin.")

    def create(self, request, *args, **kwargs):
        self._check_super_admin()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._check_super_admin()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._check_super_admin()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._check_super_admin()
        return super().destroy(request, *args, **kwargs)


@api_view(["GET", "POST", "PATCH"])
@permission_classes([IsAuthenticated])
def my_preferences(request):
    """GET → liste des prefs courantes (fusionnées avec defaults).
    POST/PATCH → met à jour la pref pour un type (payload: {type_code, channels[]}).
    """
    user = request.user

    if request.method == "GET":
        types = NotificationType.objects.filter(is_active=True).order_by("sort_order")
        prefs_map = {
            p.notification_type_id: p
            for p in UserNotificationPreference.objects.filter(user=user)
        }
        out = []
        for nt in types:
            pref = prefs_map.get(nt.id)
            out.append({
                "type_id": str(nt.id),
                "code": nt.code,
                "label": nt.label,
                "description": nt.description,
                "icon": nt.icon,
                "category": nt.category,
                "is_user_toggleable": nt.is_user_toggleable,
                "default_channels": nt.default_channels,
                "channels": (
                    pref.channels if pref is not None else nt.default_channels
                ),
                "is_overridden": pref is not None,
            })
        return Response(out)

    # POST / PATCH
    type_code = request.data.get("type_code")
    channels = request.data.get("channels", [])
    if not isinstance(channels, list):
        return Response({"detail": "channels doit être une liste."}, status=400)
    valid = {c[0] for c in Channel.choices}
    bad = [c for c in channels if c not in valid]
    if bad:
        return Response({"detail": f"Canaux inconnus : {bad}"}, status=400)

    try:
        nt = NotificationType.objects.get(code=type_code, is_active=True)
    except NotificationType.DoesNotExist:
        return Response({"detail": "Type inconnu ou désactivé."}, status=404)

    if not nt.is_user_toggleable:
        return Response({"detail": "Type non modifiable."}, status=403)

    pref, _ = UserNotificationPreference.objects.update_or_create(
        user=user, notification_type=nt,
        defaults={"channels": channels},
    )
    return Response(UserPreferenceSerializer(pref).data, status=status.HTTP_200_OK)
