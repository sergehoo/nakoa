from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsPrinterMember

from .models import (
    DeliveryZone,
    Finish,
    Machine,
    PrinterAgent,
    PrinterProfile,
    ProductionCapability,
)
from .serializers import (
    DeliveryZoneSerializer,
    FinishSerializer,
    MachineSerializer,
    PrinterAgentSerializer,
    PrinterProfileSerializer,
    PrinterPublicSerializer,
    ProductionCapabilitySerializer,
)


class PrinterDirectoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Annuaire public des imprimeurs."""

    serializer_class = PrinterPublicSerializer
    queryset = PrinterProfile.objects.filter(status="active")
    permission_classes = []
    search_fields = ["trade_name", "legal_name", "city", "description"]
    filterset_fields = ["country", "city", "is_featured"]
    ordering_fields = ["quality_score", "on_time_rate", "created_at"]

    @action(detail=False, methods=["get"], url_path="nearby")
    def nearby(self, request):
        """Recherche géographique : ?lat=5.34&lng=-4.02&radius_km=25"""
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
            radius_km = float(request.query_params.get("radius_km", 25))
        except (KeyError, ValueError):
            return Response({"detail": "lat, lng requis"}, status=400)
        point = Point(lng, lat, srid=4326)
        qs = (
            self.get_queryset()
            .filter(geo_point__distance_lte=(point, D(km=radius_km)))
            .order_by("-quality_score")
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(qs, many=True).data)


class PrinterProfileViewSet(viewsets.ModelViewSet):
    """Gestion de la fiche par l'imprimeur propriétaire."""

    serializer_class = PrinterProfileSerializer
    permission_classes = [IsAuthenticated, IsPrinterMember]

    def get_queryset(self):
        user = self.request.user
        return PrinterProfile.objects.filter(owner=user)

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        profile = self.get_queryset().first()
        if request.method == "PATCH":
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(profile).data)


class _PrinterScopedViewSet(viewsets.ModelViewSet):
    """Base : restreint au PrinterProfile de l'utilisateur courant."""

    permission_classes = [IsAuthenticated, IsPrinterMember]

    def _printer(self):
        return self.request.user.printer_profile

    def get_queryset(self):
        return self.queryset.filter(printer=self._printer())

    def perform_create(self, serializer):
        serializer.save(printer=self._printer())


class MachineViewSet(_PrinterScopedViewSet):
    serializer_class = MachineSerializer
    queryset = Machine.objects.all()


class FinishViewSet(_PrinterScopedViewSet):
    serializer_class = FinishSerializer
    queryset = Finish.objects.all()


class DeliveryZoneViewSet(_PrinterScopedViewSet):
    serializer_class = DeliveryZoneSerializer
    queryset = DeliveryZone.objects.all()


class CapabilityViewSet(_PrinterScopedViewSet):
    serializer_class = ProductionCapabilitySerializer
    queryset = ProductionCapability.objects.all()


class PrinterAgentViewSet(_PrinterScopedViewSet):
    serializer_class = PrinterAgentSerializer
    queryset = PrinterAgent.objects.all()
