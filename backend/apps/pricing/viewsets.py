from dataclasses import asdict

from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsPrinterMember

from .models import PriceGrid, PriceModifier, PriceTier, PromoCode
from .serializers import (
    PriceGridSerializer,
    PriceModifierSerializer,
    PriceTierSerializer,
    PromoCodeSerializer,
    QuoteCalcRequestSerializer,
)
from .services import PriceCalculator


class PriceGridViewSet(viewsets.ModelViewSet):
    serializer_class = PriceGridSerializer
    permission_classes = [IsAuthenticated, IsPrinterMember]

    def get_queryset(self):
        return PriceGrid.objects.filter(printer=self.request.user.printer_profile)

    def perform_create(self, serializer):
        serializer.save(printer=self.request.user.printer_profile)

    @action(detail=True, methods=["post"], url_path="quote")
    def quote(self, request, pk=None):
        grid = self.get_object()
        s = QuoteCalcRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        calc = PriceCalculator(grid)
        result = calc.quote(
            quantity=s.validated_data["quantity"],
            option_value_ids=s.validated_data.get("option_value_ids", []),
            discount_pct=s.validated_data.get("discount_pct", 0),
        )
        payload = asdict(result)
        payload["breakdown"] = [{"label": l["label"], "amount": str(l["amount"])} for l in payload["breakdown"]]
        return Response(payload)


class PriceTierViewSet(viewsets.ModelViewSet):
    serializer_class = PriceTierSerializer
    permission_classes = [IsAuthenticated, IsPrinterMember]

    def get_queryset(self):
        return PriceTier.objects.filter(grid__printer=self.request.user.printer_profile)


class PriceModifierViewSet(viewsets.ModelViewSet):
    serializer_class = PriceModifierSerializer
    permission_classes = [IsAuthenticated, IsPrinterMember]

    def get_queryset(self):
        return PriceModifier.objects.filter(grid__printer=self.request.user.printer_profile)


class PromoCodeViewSet(viewsets.ModelViewSet):
    serializer_class = PromoCodeSerializer
    queryset = PromoCode.objects.all()
    permission_classes = [IsAuthenticated]
