from django.contrib.gis.geos import Point
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsCourier

from .models import DeliveryAssignment, DeliveryProof, GPSPoint
from .serializers import (
    DeliveryAssignmentSerializer,
    DeliveryProofSerializer,
    GPSPointSerializer,
)


class DeliveryAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DeliveryAssignment.objects.all()
        return DeliveryAssignment.objects.filter(courier=user)

    @action(detail=True, methods=["post"], url_path="report-location",
            permission_classes=[IsAuthenticated, IsCourier])
    def report_location(self, request, pk=None):
        a = self.get_object()
        lat = request.data.get("lat")
        lng = request.data.get("lng")
        if lat is None or lng is None:
            return Response({"detail": "lat, lng requis"}, status=400)
        GPSPoint.objects.create(
            assignment=a,
            location=Point(float(lng), float(lat), srid=4326),
            speed_kmh=request.data.get("speed_kmh"),
            heading=request.data.get("heading"),
            accuracy_m=request.data.get("accuracy_m"),
            recorded_at=request.data.get("recorded_at"),
        )
        return Response({"ok": True})


class DeliveryProofViewSet(viewsets.ModelViewSet):
    serializer_class = DeliveryProofSerializer
    queryset = DeliveryProof.objects.all()
    permission_classes = [IsAuthenticated]
