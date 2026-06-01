from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils import generate_reference

from .models import QuoteRequest, QuoteStatus
from .serializers import QuoteRequestSerializer


class QuoteRequestViewSet(viewsets.ModelViewSet):
    serializer_class = QuoteRequestSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "product"]
    ordering_fields = ["created_at", "desired_delivery_at"]

    def get_queryset(self):
        return QuoteRequest.objects.filter(customer=self.request.user).prefetch_related("offers__printer")

    def perform_create(self, serializer):
        serializer.save(
            customer=self.request.user,
            reference=generate_reference("QR"),
            created_by=self.request.user,
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Soumet la demande au matching."""
        from apps.matching.tasks import run_matching

        qr = self.get_object()
        if qr.status not in {QuoteStatus.DRAFT, QuoteStatus.OPEN}:
            return Response({"detail": "Statut incompatible"}, status=400)
        qr.status = QuoteStatus.OPEN
        qr.save(update_fields=["status"])
        run_matching.delay(str(qr.id))
        return Response({"submitted": True})

    @action(detail=True, methods=["post"], url_path="select-offer")
    def select_offer(self, request, pk=None):
        offer_id = request.data.get("offer_id")
        qr = self.get_object()
        offer = qr.offers.filter(id=offer_id, is_active=True).first()
        if not offer:
            return Response({"detail": "Offre introuvable"}, status=404)
        qr.selected_offer = offer
        qr.status = QuoteStatus.SELECTED
        qr.save(update_fields=["selected_offer", "status"])
        return Response({"selected": True, "offer_id": str(offer.id)})

    @action(detail=True, methods=["post"], url_path="convert")
    def convert_to_order(self, request, pk=None):
        from apps.orders.services import create_order_from_quote

        qr = self.get_object()
        if not qr.selected_offer:
            return Response({"detail": "Sélectionnez d'abord une offre."}, status=400)
        order = create_order_from_quote(qr)
        qr.status = QuoteStatus.CONVERTED
        qr.save(update_fields=["status"])
        return Response({"order_id": str(order.id), "reference": order.reference},
                        status=status.HTTP_201_CREATED)
