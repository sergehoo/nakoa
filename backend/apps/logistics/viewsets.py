from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Carrier, Route, Shipment
from .serializers import CarrierSerializer, RouteSerializer, ShipmentSerializer


class CarrierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Carrier.objects.filter(is_active=True)
    serializer_class = CarrierSerializer
    permission_classes = [IsAuthenticated]


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]
