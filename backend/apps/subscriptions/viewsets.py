"""ViewSets DRF du Subscription Engine.

- PlanViewSet (public + admin) : lecture libre, écriture Super Admin.
- SubscriptionViewSet (customer) : list/retrieve/subscribe/cancel sur l'utilisateur courant.
- AdminSubscriptionViewSet (admin) : table complète des abonnés.
"""

from __future__ import annotations

import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Plan, Subscription
from .serializers import (
    CancelRequestSerializer,
    PlanSerializer,
    SubscribeRequestSerializer,
    SubscriptionSerializer,
)
from .services import (
    SubscriptionBillingService,
    SubscriptionError,
    get_active_subscription,
)

logger = logging.getLogger(__name__)


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
# Plans — lecture libre, écriture Super Admin
# ============================================================
class PlanViewSet(viewsets.ModelViewSet):
    """CRUD des plans d'abonnement.

    - GET (list/retrieve) : public — n'affiche que `is_public=True, is_active=True`
      sauf pour les Super Admins qui voient tout.
    - POST/PATCH/DELETE   : Super Admin uniquement.
    """

    serializer_class = PlanSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Plan.objects.all()
        if _is_super_admin(self.request.user):
            return qs
        if self.action in ("list", "retrieve"):
            return qs.filter(is_public=True, is_active=True)
        return qs.none()

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


# ============================================================
# Subscriptions — l'utilisateur courant
# ============================================================
class SubscriptionViewSet(viewsets.GenericViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request):
        qs = Subscription.objects.filter(subscriber=request.user).select_related("plan")
        return Response(SubscriptionSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        sub = get_active_subscription(request.user)
        if not sub:
            return Response({"active": False})
        return Response({"active": True, **SubscriptionSerializer(sub).data})

    @action(detail=False, methods=["post"])
    def subscribe(self, request):
        serializer = SubscribeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        plan_ref = data["plan"]
        try:
            plan = Plan.objects.filter(is_active=True).get(
                **({"code": plan_ref} if not plan_ref.isdigit() and "-" in plan_ref else {"id": plan_ref})
            )
        except (Plan.DoesNotExist, ValueError):
            try:
                plan = Plan.objects.filter(is_active=True).get(code=plan_ref)
            except Plan.DoesNotExist:
                return Response({"detail": "Plan introuvable."}, status=status.HTTP_404_NOT_FOUND)

        try:
            result = SubscriptionBillingService().subscribe(
                user=request.user,
                plan=plan,
                cycle=data["cycle"],
                start_trial=data.get("start_trial", True),
                provider_reference=data.get("provider_reference", "") or "",
            )
        except SubscriptionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "subscription": SubscriptionSerializer(result.subscription).data,
            "payment_required": result.payment_required,
            "amount": str(result.amount),
            "currency": result.currency,
            "payment_reference": result.payment_reference,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def cancel(self, request):
        serializer = CancelRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sub = get_active_subscription(request.user)
        if not sub:
            return Response({"detail": "Aucun abonnement actif."},
                            status=status.HTTP_404_NOT_FOUND)
        sub = SubscriptionBillingService().cancel(
            sub, reason=serializer.validated_data.get("reason", "") or "",
        )
        return Response(SubscriptionSerializer(sub).data)


# ============================================================
# Admin — vision globale des abonnés
# ============================================================
class AdminSubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """Lecture seule pour les admins (utile au support et à la finance)."""

    serializer_class = SubscriptionSerializer
    queryset = Subscription.objects.select_related("plan", "subscriber").all()

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        if not _is_admin_staff(self.request.user):
            return Subscription.objects.none()
        qs = super().get_queryset()
        status_q = self.request.query_params.get("status")
        if status_q:
            qs = qs.filter(status=status_q)
        plan_q = self.request.query_params.get("plan")
        if plan_q:
            qs = qs.filter(plan_id=plan_q)
        return qs
