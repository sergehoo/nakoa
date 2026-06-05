from decimal import Decimal

from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsPrinterMember
from apps.core.utils import generate_reference

from .models import QuoteOffer, QuoteRequest, QuoteStatus
from .opportunity_service import (
    auto_enrich_printer_catalog,
    get_open_opportunities_for_printer,
    notify_opportunity_if_uncovered,
    submit_opportunity_response,
)
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
        """Soumet la demande : déclenche matching IA + notif opportunités si découvert."""
        from apps.matching.tasks import run_matching

        qr = self.get_object()
        if qr.status not in {QuoteStatus.DRAFT, QuoteStatus.OPEN}:
            return Response({"detail": "Statut incompatible"}, status=400)
        qr.status = QuoteStatus.OPEN
        qr.save(update_fields=["status"])

        # Matching IA classique
        run_matching.delay(str(qr.id))

        # Si aucun PrinterProduct → opportunité ouverte aux imprimeurs
        opportunity_stats = notify_opportunity_if_uncovered(qr)

        return Response({"submitted": True, "opportunity": opportunity_stats})

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

        # Auto-enrichissement catalogue imprimeur (si c'était une opportunité)
        enriched = auto_enrich_printer_catalog(offer)

        return Response({
            "selected": True,
            "offer_id": str(offer.id),
            "printer_catalog_enriched": enriched,
        })

    @action(detail=True, methods=["post"], url_path="convert")
    def convert_to_order(self, request, pk=None):
        from apps.orders.services import create_order_from_quote

        qr = self.get_object()
        if not qr.selected_offer:
            return Response({"detail": "Sélectionnez d'abord une offre."}, status=400)
        order = create_order_from_quote(qr)
        qr.status = QuoteStatus.CONVERTED
        qr.save(update_fields=["status"])
        return Response(
            {"order_id": str(order.id), "reference": order.reference},
            status=status.HTTP_201_CREATED,
        )


# ============================================================================
# Vue imprimeur : opportunités
# ============================================================================

class OpportunityListSerializer(drf_serializers.ModelSerializer):
    """Liste des opportunités côté imprimeur (vue compacte)."""

    product_detail = drf_serializers.SerializerMethodField()
    customer_initials = drf_serializers.SerializerMethodField()

    class Meta:
        model = QuoteRequest
        fields = [
            "id", "reference", "quantity", "currency",
            "budget_min", "budget_max",
            "desired_delivery_at", "delivery_country", "delivery_city",
            "customer_notes", "status", "created_at",
            "product_detail", "customer_initials",
        ]

    def get_product_detail(self, obj: QuoteRequest):
        p = obj.product
        return {
            "id": str(p.id),
            "name": p.name,
            "slug": p.slug,
            "short_description": p.short_description,
            "category": p.category.name if p.category_id else None,
            "lead_time_days": p.lead_time_days,
            "min_quantity": p.min_quantity,
        }

    def get_customer_initials(self, obj: QuoteRequest):
        # On masque l'identité du client tant qu'aucune offre n'a été acceptée
        if not obj.customer_id:
            return "—"
        name = obj.customer.full_name or obj.customer.email
        return "".join(p[0] for p in name.split()[:2]).upper()


class OpportunityViewSet(viewsets.GenericViewSet):
    """Endpoints imprimeur pour les opportunités.

    - GET  /quote-requests/opportunities/                  → liste
    - POST /quote-requests/opportunities/<id>/respond/    → soumet une offre opportunité
    - POST /quote-requests/opportunities/<id>/decline/    → décline (juste tracking)
    """

    serializer_class = OpportunityListSerializer
    permission_classes = [IsAuthenticated, IsPrinterMember]

    def get_queryset(self):
        printer = getattr(self.request.user, "printer_profile", None)
        return get_open_opportunities_for_printer(printer)

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                OpportunityListSerializer(page, many=True, context={"request": request}).data,
            )
        return Response(
            OpportunityListSerializer(qs, many=True, context={"request": request}).data,
        )

    @action(detail=True, methods=["post"], url_path="respond")
    def respond(self, request, pk=None):
        """Soumet une offre sur une opportunité."""
        printer = request.user.printer_profile
        try:
            quote_request = QuoteRequest.objects.get(pk=pk)
        except QuoteRequest.DoesNotExist:
            return Response({"detail": "Demande introuvable"}, status=404)

        try:
            unit_price = Decimal(str(request.data.get("unit_price", "0")))
            lead = int(request.data.get("estimated_lead_time_days", 5))
            delivery_fee = Decimal(str(request.data.get("delivery_fee", "0")))
        except (TypeError, ValueError):
            return Response({"detail": "Paramètres invalides"}, status=400)

        if unit_price <= 0:
            return Response({"detail": "unit_price doit être > 0"}, status=400)

        offer = submit_opportunity_response(
            quote_request=quote_request,
            printer=printer,
            unit_price=unit_price,
            estimated_lead_time_days=lead,
            delivery_fee=delivery_fee,
            notes=request.data.get("notes", ""),
        )
        return Response({
            "offer_id": str(offer.id),
            "total_incl_tax": str(offer.total_incl_tax),
            "expected_delivery_at": offer.expected_delivery_at.isoformat()
            if offer.expected_delivery_at else None,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="decline")
    def decline(self, request, pk=None):
        """Marque une opportunité comme déclinée (tracking only, optionnel)."""
        # Pour l'instant on ne stocke pas explicitement. Le filtre `exclude(already_responded)`
        # suffit côté UX : l'imprimeur peut ignorer l'opportunité.
        return Response({"declined": True})
