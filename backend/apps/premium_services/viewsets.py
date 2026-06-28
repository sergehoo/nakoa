"""ViewSets DRF des Premium Services."""

from __future__ import annotations

from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import OrderService, PremiumService, ServiceCategory
from .serializers import (
    OrderServiceSerializer,
    PremiumServiceSerializer,
    PriceRequestSerializer,
    ServiceCategorySerializer,
)
from .services import PremiumServicePricer


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


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceCategorySerializer
    queryset = ServiceCategory.objects.all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]

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


class PremiumServiceViewSet(viewsets.ModelViewSet):
    serializer_class = PremiumServiceSerializer
    queryset = PremiumService.objects.select_related("category").all()

    def get_permissions(self):
        if self.action in ("list", "retrieve", "price"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Le grand public ne voit que actifs + visibles
        if not _is_super_admin(self.request.user) and self.action in ("list", "retrieve"):
            qs = qs.filter(is_active=True, is_visible=True)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        return qs

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


class PricingViewSet(viewsets.ViewSet):
    """POST /price/ — donne le total d'une sélection de services."""

    permission_classes = [AllowAny]

    def create(self, request):
        serializer = PriceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Normalise la sélection en (code, qty)
        selection: list[tuple[str, int]] = []
        for row in data.get("selection") or []:
            code = (row.get("service_code") or "").strip()
            qty = int(row.get("quantity") or 1)
            if code and qty > 0:
                selection.append((code, qty))

        result = PremiumServicePricer().price(
            service_codes=selection,
            order_total=Decimal(str(data.get("order_total") or 0)),
            currency=data.get("currency") or "XOF",
        )
        return Response(result.to_dict())


class OrderServiceViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture seule — l'écriture passe par le checkout (à brancher plus tard)."""

    serializer_class = OrderServiceSerializer
    queryset = OrderService.objects.select_related("service").all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        if not _is_admin_staff(self.request.user):
            return qs.none()
        order_id = self.request.query_params.get("order_id")
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs
