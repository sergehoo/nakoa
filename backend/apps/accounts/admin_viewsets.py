"""Viewsets d'administration plateforme — accès staff/admin uniquement."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import filters, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .serializers import UserSerializer

User = get_user_model()


class StandardPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 200


class AdminUserViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Annuaire admin des utilisateurs.

    Endpoints :
    - GET    /accounts/admin/users/                 — liste paginée + filtres
    - GET    /accounts/admin/users/{id}/            — détail
    - PATCH  /accounts/admin/users/{id}/            — mise à jour partielle
    - POST   /accounts/admin/users/{id}/suspend/    — suspendre
    - POST   /accounts/admin/users/{id}/activate/   — réactiver
    """

    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "last_login_at", "email", "primary_role"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = User.objects.all().order_by("-created_at")

        params = self.request.query_params
        search = params.get("search")
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
            )

        role = params.get("primary_role")
        if role:
            qs = qs.filter(primary_role=role)

        country = params.get("country")
        if country:
            qs = qs.filter(country=country)

        is_active = params.get("is_active")
        if is_active is not None and is_active != "":
            qs = qs.filter(is_active=str(is_active).lower() in ("true", "1"))

        is_suspended = params.get("is_suspended")
        if is_suspended is not None and is_suspended != "":
            qs = qs.filter(is_suspended=str(is_suspended).lower() in ("true", "1"))

        return qs

    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {"detail": "Vous ne pouvez pas suspendre un super-administrateur."},
                status=status.HTTP_403_FORBIDDEN,
            )
        reason = (request.data or {}).get("reason", "")
        user.is_suspended = True
        user.is_active = False
        user.suspension_reason = reason
        user.save(update_fields=["is_suspended", "is_active", "suspension_reason"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_suspended = False
        user.is_active = True
        user.suspension_reason = ""
        user.save(update_fields=["is_suspended", "is_active", "suspension_reason"])
        return Response(self.get_serializer(user).data)
