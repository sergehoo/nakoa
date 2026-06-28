"""ViewSets publics du catalogue Nakoa."""

from __future__ import annotations

from decimal import Decimal

from django.db.models import Avg, Count, Min, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = ["parent"]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """Catalogue produit public — lecture seule + filtres avancés."""

    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related(
        "options__values", "images", "templates",
    )
    permission_classes = [AllowAny]
    lookup_field = "slug"
    # `category` est géré manuellement dans get_queryset (slug OU UUID).
    filterset_fields = ["is_featured"]
    search_fields = ["name", "short_description", "tags"]
    ordering_fields = ["sort_order", "lead_time_days", "created_at"]

    @staticmethod
    def _looks_like_uuid(value: str) -> bool:
        """`True` si la chaîne ressemble à un UUID v4 (36 chars avec tirets)."""
        if not value or not isinstance(value, str):
            return False
        if len(value) not in (32, 36):
            return False
        try:
            import uuid as _uuid
            _uuid.UUID(value)
            return True
        except (ValueError, AttributeError):
            return False

    def get_queryset(self):  # type: ignore[override]
        qs = super().get_queryset()
        params = self.request.query_params

        # ----- Catégorie : accepte UUID (id) OU slug (insensible à la casse) -----
        category = params.get("category")
        if category:
            if self._looks_like_uuid(category):
                qs = qs.filter(category_id=category)
            else:
                # Normalise vers lower-case pour matcher slugs en base
                qs = qs.filter(category__slug__iexact=category)

        # Filtres "prix": s'appliquent sur le min_price des PrinterProduct actifs liés
        price_min = self._to_decimal(params.get("price_min"))
        price_max = self._to_decimal(params.get("price_max"))
        lead_max = self._to_int(params.get("lead_time_max"))
        rating_min = self._to_float(params.get("rating_min"))
        printer = params.get("printer")
        in_stock = params.get("in_stock")

        # Annotations pour permettre les filtres
        qs = qs.annotate(
            from_price=Min(
                "printer_offerings__min_price",
                filter=Q(printer_offerings__is_active=True),
            ),
            offers_count=Count(
                "printer_offerings",
                filter=Q(printer_offerings__is_active=True),
                distinct=True,
            ),
            avg_rating=Avg(
                "printer_offerings__printer__reviews__overall_rating",
                filter=Q(printer_offerings__printer__reviews__status="published"),
            ),
        )

        if price_min is not None:
            qs = qs.filter(from_price__gte=price_min)
        if price_max is not None:
            qs = qs.filter(from_price__lte=price_max)
        if lead_max is not None:
            qs = qs.filter(
                Q(lead_time_days__lte=lead_max)
                | Q(printer_offerings__standard_lead_time_days__lte=lead_max,
                    printer_offerings__is_active=True),
            )
        if rating_min is not None:
            qs = qs.filter(avg_rating__gte=rating_min)
        if printer:
            qs = qs.filter(
                printer_offerings__printer__slug=printer,
                printer_offerings__is_active=True,
            )
        if in_stock in {"1", "true", "yes"}:
            qs = qs.filter(offers_count__gt=0)

        return qs.distinct()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    # ============================================================
    # GET /catalog/products/<slug>/printers/
    # ============================================================
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def printers(self, request, slug=None):
        """Liste les imprimeurs proposant ce produit, triés par note décroissante."""
        product = self.get_object()
        try:
            from apps.printers.models import PrinterProduct
        except ImportError:
            return Response({"results": []})

        offerings = (
            PrinterProduct.objects.filter(product=product, is_active=True)
            .select_related("printer")
            .annotate(
                printer_avg_rating=Avg(
                    "printer__reviews__overall_rating",
                    filter=Q(printer__reviews__status="published"),
                ),
                printer_reviews_count=Count(
                    "printer__reviews",
                    filter=Q(printer__reviews__status="published"),
                    distinct=True,
                ),
            )
            .order_by("min_price")
        )

        data = []
        for off in offerings:
            printer = off.printer
            data.append({
                "id": str(off.id),
                "printer_id": str(printer.id),
                "printer_slug": getattr(printer, "slug", ""),
                "printer_name": getattr(printer, "trade_name", "") or getattr(printer, "legal_name", ""),
                "printer_city": getattr(printer, "city", "") or "",
                "printer_country": getattr(printer, "country", "") or "",
                "printer_is_premium": bool(getattr(printer, "is_premium", False)),
                "printer_logo": (
                    printer.logo.url if getattr(printer, "logo", None) else None
                ),
                "min_price": str(off.min_price),
                "setup_cost": str(off.setup_cost),
                "currency": off.currency,
                "standard_lead_time_days": off.standard_lead_time_days,
                "express_lead_time_days": off.express_lead_time_days,
                "is_express_available": off.is_express_available,
                "daily_capacity": off.daily_capacity,
                "orders_count": off.orders_count,
                "rating": float(off.printer_avg_rating or 0),
                "reviews_count": int(off.printer_reviews_count or 0),
                "notes": off.notes or "",
            })

        return Response({
            "product_slug": product.slug,
            "product_name": product.name,
            "count": len(data),
            "results": data,
        })

    # ============================================================
    # GET /catalog/products/<slug>/reviews/
    # ============================================================
    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def reviews(self, request, slug=None):
        """Reviews publiés des imprimeurs qui proposent ce produit.

        Fait office d'avis "produit" en attendant un système de review au niveau
        ligne de commande / produit.
        """
        product = self.get_object()
        try:
            from apps.reviews.models import Review
        except ImportError:
            return Response({"results": [], "average": 0, "total": 0})

        reviews_qs = (
            Review.objects.filter(
                printer__printer_products__product=product,
                printer__printer_products__is_active=True,
                status="published",
            )
            .select_related("customer", "printer")
            .order_by("-created_at")
            .distinct()[:50]
        )
        aggregated = reviews_qs.aggregate(
            avg=Avg("overall_rating"),
            total=Count("id"),
        )

        data = []
        for r in reviews_qs:
            data.append({
                "id": str(r.id),
                "customer_name": getattr(r.customer, "full_name", "") or getattr(r.customer, "email", "")[:3] + "***",
                "printer_name": getattr(r.printer, "trade_name", "") or getattr(r.printer, "legal_name", ""),
                "overall_rating": r.overall_rating,
                "quality_rating": r.quality_rating,
                "delivery_rating": r.delivery_rating,
                "communication_rating": r.communication_rating,
                "title": r.title,
                "body": r.body,
                "is_verified": r.is_verified,
                "created_at": r.created_at.isoformat(),
                "printer_response": r.printer_response,
            })

        return Response({
            "average": float(aggregated["avg"] or 0),
            "total": int(aggregated["total"] or 0),
            "results": data,
        })

    # ----- Helpers --------------------------------------------------
    @staticmethod
    def _to_decimal(value):
        if not value:
            return None
        try:
            return Decimal(str(value))
        except Exception:  # noqa: BLE001
            return None

    @staticmethod
    def _to_int(value):
        if value in (None, ""):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _to_float(value):
        if value in (None, ""):
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
