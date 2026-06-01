from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils import generate_reference

from .models import Ticket, TicketMessage
from .serializers import TicketMessageSerializer, TicketSerializer


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "priority", "category"]
    search_fields = ["reference", "subject"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Ticket.objects.all().prefetch_related("messages")
        return Ticket.objects.filter(requester=user).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user, reference=generate_reference("TKT"))

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        msg = TicketMessage.objects.create(
            ticket=ticket, sender=request.user,
            body=request.data.get("body", ""),
            is_internal=request.data.get("is_internal", False) and request.user.is_staff,
        )
        return Response(TicketMessageSerializer(msg).data, status=201)
