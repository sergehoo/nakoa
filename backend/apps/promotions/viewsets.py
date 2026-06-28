"""ViewSets DRF du Promotion Engine."""

from __future__ import annotations

from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CouponCode, CouponRedemption, PromotionCampaign
from .serializers import (
    CouponCodeSerializer,
    CouponRedemptionSerializer,
    CouponValidateRequestSerializer,
    GenerateCodesSerializer,
    PromotionCampaignSerializer,
)
from .services import CouponValidator, generate_codes


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
# Campagnes — admin
# ============================================================
class PromotionCampaignViewSet(viewsets.ModelViewSet):
    serializer_class = PromotionCampaignSerializer
    queryset = PromotionCampaign.objects.all().prefetch_related("codes")
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not _is_admin_staff(self.request.user):
            return PromotionCampaign.objects.none()
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

    @action(detail=True, methods=["post"], url_path="generate-codes")
    def generate_codes(self, request, pk=None):
        self._check_super_admin()
        serializer = GenerateCodesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = self.get_object()
        codes = generate_codes(
            campaign,
            count=serializer.validated_data["count"],
            prefix=serializer.validated_data.get("prefix", ""),
            length=serializer.validated_data.get("length", 8),
        )
        return Response(
            {
                "created": len(codes),
                "codes": CouponCodeSerializer(codes, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# Codes — admin
# ============================================================
class CouponCodeViewSet(viewsets.ModelViewSet):
    serializer_class = CouponCodeSerializer
    queryset = CouponCode.objects.select_related("campaign").all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not _is_admin_staff(self.request.user):
            return CouponCode.objects.none()
        qs = super().get_queryset()
        campaign = self.request.query_params.get("campaign")
        if campaign:
            qs = qs.filter(campaign_id=campaign)
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


# ============================================================
# Rédemptions — lecture seule admin
# ============================================================
class CouponRedemptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CouponRedemptionSerializer
    queryset = CouponRedemption.objects.select_related("code", "campaign", "user").all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not _is_admin_staff(self.request.user):
            return CouponRedemption.objects.none()
        qs = super().get_queryset()
        status_q = self.request.query_params.get("status")
        if status_q:
            qs = qs.filter(status=status_q)
        return qs


# ============================================================
# Validation customer — POST /promotions/validate/
# ============================================================
class CouponValidateViewSet(viewsets.ViewSet):
    """Endpoint customer pour pré-valider un code et obtenir le discount."""

    permission_classes = [IsAuthenticated]

    def create(self, request):
        serializer = CouponValidateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        validator = CouponValidator()
        result = validator.validate(
            code=data["code"],
            user=request.user,
            order_total=Decimal(str(data["order_total"])),
            context={"customer": {"id": str(request.user.id)}},
        )
        return Response(result.to_dict(), status=status.HTTP_200_OK if result.ok else status.HTTP_400_BAD_REQUEST)
