from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsPrinterMember

from django.db import transaction

from .models import (
    DeliveryZone,
    Finish,
    Machine,
    PrinterAgent,
    PrinterProduct,
    PrinterProfile,
    ProductionCapability,
)
from .serializers import (
    DeliveryZoneSerializer,
    FinishSerializer,
    MachineSerializer,
    PrinterAgentSerializer,
    PrinterProductPublicSerializer,
    PrinterProductSerializer,
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


class PrinterProductViewSet(_PrinterScopedViewSet):
    """CRUD des produits proposés par l'imprimeur courant.

    Routes additionnelles :
    - POST /printers/printer-products/bulk-activate/  → active plusieurs produits d'un coup
    - GET  /printers/printer-products/available/      → liste des produits catalogue non encore activés
    """
    serializer_class = PrinterProductSerializer
    queryset = PrinterProduct.objects.select_related("product", "product__category", "printer").all()

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """Produits du catalogue Nakoa que l'imprimeur n'a PAS encore activés."""
        from apps.catalog.models import Product
        printer = self._printer()
        activated_ids = PrinterProduct.objects.filter(printer=printer).values_list("product_id", flat=True)
        qs = (
            Product.objects.filter(is_active=True)
            .exclude(id__in=activated_ids)
            .select_related("category")
        )
        category = request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search) | Q(short_description__icontains=search),
            )

        results = []
        for p in qs[:200]:
            results.append({
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "short_description": p.short_description,
                "cover_image": p.cover_image.url if p.cover_image else None,
                "category": {
                    "id": str(p.category_id),
                    "name": p.category.name,
                    "slug": p.category.slug,
                },
                "min_quantity": p.min_quantity,
                "lead_time_days": p.lead_time_days,
            })
        return Response({"count": len(results), "results": results})

    @action(detail=False, methods=["post"], url_path="bulk-activate")
    @transaction.atomic
    def bulk_activate(self, request):
        """Active plusieurs produits d'un coup avec des valeurs par défaut.

        Payload : {"product_ids": ["uuid1", "uuid2"], "defaults": {min_price, ...}}
        """
        product_ids = (request.data or {}).get("product_ids", [])
        defaults = (request.data or {}).get("defaults", {}) or {}
        if not product_ids:
            return Response({"detail": "product_ids requis"}, status=400)

        from apps.catalog.models import Product
        printer = self._printer()
        existing = set(
            PrinterProduct.objects.filter(printer=printer, product_id__in=product_ids)
            .values_list("product_id", flat=True)
        )

        created = []
        for product in Product.objects.filter(id__in=product_ids, is_active=True):
            if str(product.id) in {str(e) for e in existing}:
                continue
            pp = PrinterProduct.objects.create(
                printer=printer,
                product=product,
                min_price=defaults.get("min_price", 0),
                setup_cost=defaults.get("setup_cost", 0),
                currency=defaults.get("currency", "XOF"),
                daily_capacity=defaults.get("daily_capacity", 1000),
                standard_lead_time_days=defaults.get("standard_lead_time_days", product.lead_time_days or 3),
                express_lead_time_days=defaults.get("express_lead_time_days", 1),
                is_active=True,
            )
            created.append(pp)

        return Response({
            "created": len(created),
            "skipped": len(product_ids) - len(created),
            "results": PrinterProductSerializer(created, many=True).data,
        })


class ProductOfferingsView(viewsets.ReadOnlyModelViewSet):
    """Endpoint public : liste les offres imprimeurs pour un produit donné.

    GET /printers/product-offerings/?product=<slug-ou-uuid>
    Retourne toutes les offres actives, triées par prix croissant, score qualité décroissant.
    """
    serializer_class = PrinterProductPublicSerializer
    permission_classes = []  # public

    def get_queryset(self):
        qs = PrinterProduct.objects.filter(
            is_active=True,
            printer__status="active",
            printer__kyc_status="approved",
        ).select_related("printer", "product")

        product_param = self.request.query_params.get("product")
        if product_param:
            # Accepte slug OU uuid
            from django.db.models import Q
            qs = qs.filter(Q(product__slug=product_param) | Q(product_id=product_param))

        country = self.request.query_params.get("country")
        if country:
            qs = qs.filter(printer__country=country)

        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(printer__city__iexact=city)

        # Tri par défaut : prix asc, puis score qualité desc
        ordering = self.request.query_params.get("ordering", "min_price")
        return qs.order_by(ordering, "-printer__quality_score")
