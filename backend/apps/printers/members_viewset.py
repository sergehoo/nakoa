"""Wrapper friendly autour de PrinterAgent : gestion équipe imprimeur (/members/).

Fournit la shape attendue par le frontend Nakoa (email, full_name, role, is_active)
et un flow d'invitation par email (crée l'utilisateur si nécessaire).
"""

from __future__ import annotations

import secrets

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsPrinterMember

from .models import PrinterAgent

User = get_user_model()


ROLE_PERMISSIONS = {
    "owner": {"can_manage_orders": True, "can_manage_pricing": True, "can_manage_team": True},
    "manager": {"can_manage_orders": True, "can_manage_pricing": True, "can_manage_team": True},
    "operator": {"can_manage_orders": True, "can_manage_pricing": False, "can_manage_team": False},
    "accountant": {"can_manage_orders": False, "can_manage_pricing": False, "can_manage_team": False},
    "viewer": {"can_manage_orders": False, "can_manage_pricing": False, "can_manage_team": False},
}


class PrinterMemberSerializer(serializers.ModelSerializer):
    """Vue 'member' à la sauce frontend : enveloppe PrinterAgent."""

    email = serializers.EmailField(write_only=False, required=False)
    full_name = serializers.SerializerMethodField()
    invited_at = serializers.DateTimeField(source="created_at", read_only=True)
    joined_at = serializers.SerializerMethodField()

    class Meta:
        model = PrinterAgent
        fields = ["id", "user", "email", "full_name", "role", "is_active", "invited_at", "joined_at"]
        read_only_fields = ["id", "user", "full_name", "invited_at", "joined_at"]

    def get_full_name(self, obj: PrinterAgent) -> str:
        u = obj.user
        return f"{u.first_name or ''} {u.last_name or ''}".strip() or u.email

    def get_joined_at(self, obj: PrinterAgent) -> str | None:
        # Considère "rejoint" si l'utilisateur s'est connecté au moins une fois
        if obj.user and obj.user.last_login_at:
            return obj.user.last_login_at.isoformat()
        return None


class PrinterMemberViewSet(viewsets.ModelViewSet):
    """CRUD membres pour un imprimeur. L'invitation crée le User si l'email est inconnu."""

    serializer_class = PrinterMemberSerializer
    permission_classes = [IsAuthenticated, IsPrinterMember]

    def get_queryset(self):
        return PrinterAgent.objects.filter(printer=self.request.user.printer_profile).select_related("user")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        email = (request.data.get("email") or "").lower().strip()
        role = request.data.get("role", "operator")
        if not email:
            return Response({"detail": "Email requis."}, status=400)
        if role not in ROLE_PERMISSIONS:
            return Response({"detail": f"Rôle '{role}' invalide."}, status=400)

        printer = request.user.printer_profile
        if not printer:
            return Response({"detail": "Vous n'êtes pas associé à un imprimeur."}, status=403)

        # Récupère ou crée l'utilisateur
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                password=secrets.token_urlsafe(20),
                primary_role="printer_agent",
                is_active=False,  # le membre devra activer son compte via OTP/lien
            )
            # TODO: envoyer un email d'invitation avec lien d'activation
            # send_team_invitation_email.delay(user.id, printer.id, request.user.id)

        # Évite les doublons
        existing = PrinterAgent.objects.filter(printer=printer, user=user).first()
        if existing:
            return Response(
                {"detail": "Ce membre fait déjà partie de l'équipe."},
                status=400,
            )

        perms = ROLE_PERMISSIONS[role]
        agent = PrinterAgent.objects.create(
            printer=printer,
            user=user,
            role=role,
            is_active=True,
            **perms,
        )
        return Response(self.get_serializer(agent).data, status=201)

    def perform_update(self, serializer):
        # Si le rôle change, on réajuste les permissions
        role = serializer.validated_data.get("role")
        if role and role in ROLE_PERMISSIONS:
            serializer.save(**ROLE_PERMISSIONS[role])
        else:
            serializer.save()
