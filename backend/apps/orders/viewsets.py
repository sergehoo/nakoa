from django_fsm import TransitionNotAllowed
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.exceptions import InvalidStateTransition

from .models import Order
from .serializers import OrderListSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "printer", "currency"]
    search_fields = ["reference"]
    ordering_fields = ["created_at", "expected_delivery_at", "total_incl_tax"]

    def get_serializer_class(self):
        if self.action == "list":
            return OrderListSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related("product", "printer", "customer").prefetch_related("status_history")
        if user.is_staff:
            return qs
        if getattr(user, "is_printer", False) and hasattr(user, "printer_profile"):
            return qs.filter(printer=user.printer_profile)
        return qs.filter(customer=user)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self._transition(self.get_object(), "accept")

    @action(detail=True, methods=["post"], url_path="start-production")
    def start_production(self, request, pk=None):
        return self._transition(self.get_object(), "start_production")

    @action(detail=True, methods=["post"], url_path="quality-check")
    def quality_check(self, request, pk=None):
        return self._transition(self.get_object(), "to_quality_check")

    @action(detail=True, methods=["post"], url_path="ready-pickup")
    def ready_pickup(self, request, pk=None):
        return self._transition(self.get_object(), "ready_pickup")

    @action(detail=True, methods=["post"], url_path="start-delivery")
    def start_delivery(self, request, pk=None):
        return self._transition(self.get_object(), "start_delivery")

    @action(detail=True, methods=["post"])
    def deliver(self, request, pk=None):
        return self._transition(self.get_object(), "deliver")

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        return self._transition(self.get_object(), "complete")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get("reason", "")
        try:
            order.cancel(reason=reason)
            order.save()
        except TransitionNotAllowed as exc:
            raise InvalidStateTransition() from exc
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"])
    def dispute(self, request, pk=None):
        return self._transition(self.get_object(), "dispute")

    def _transition(self, order: Order, method_name: str):
        try:
            getattr(order, method_name)()
            order.save()
        except TransitionNotAllowed as exc:
            raise InvalidStateTransition() from exc
        return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)
