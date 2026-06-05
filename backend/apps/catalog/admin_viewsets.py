"""Viewsets d'administration du catalogue Nakoa — accès staff uniquement."""

from __future__ import annotations

import csv
import io

from django.db import transaction
from django.db.models import Count, Q
from django.utils.text import slugify
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer


class AdminPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 500


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """CRUD complet sur les catégories du catalogue."""

    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    queryset = Category.objects.all().order_by("position", "name")
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["position", "name", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Annotation : nb de produits par catégorie
        return qs.annotate(products_count=Count("products"))


class AdminProductViewSet(viewsets.ModelViewSet):
    """CRUD complet sur les produits du catalogue.

    Endpoints additionnels :
    - GET    /catalog/admin/products/stats/   → KPIs globaux
    - POST   /catalog/admin/products/import-csv/  → import en masse
    """

    serializer_class = ProductDetailSerializer
    permission_classes = [IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "slug", "short_description", "tags"]
    ordering_fields = ["sort_order", "name", "created_at", "lead_time_days"]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = (
            Product.objects.all()
            .select_related("category")
            .annotate(printers_count=Count("printer_offerings"))
            .order_by("category__position", "sort_order", "name")
        )
        # Filtres custom
        params = self.request.query_params
        if params.get("category"):
            qs = qs.filter(category__slug=params["category"])
        if params.get("is_active") in ("true", "false"):
            qs = qs.filter(is_active=params["is_active"] == "true")
        if params.get("uncovered") == "true":
            # Produits sans aucun imprimeur actif
            qs = qs.filter(printer_offerings__isnull=True)
        return qs

    def perform_create(self, serializer):
        if not serializer.validated_data.get("slug"):
            serializer.save(slug=slugify(serializer.validated_data["name"])[:170])
        else:
            serializer.save()

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        total = Product.objects.count()
        active = Product.objects.filter(is_active=True).count()
        uncovered = (
            Product.objects.annotate(c=Count("printer_offerings"))
            .filter(c=0, is_active=True)
            .count()
        )
        per_category = (
            Category.objects.annotate(
                total=Count("products"),
                active=Count("products", filter=Q(products__is_active=True)),
            )
            .values("id", "name", "slug", "total", "active")
            .order_by("position")
        )
        return Response({
            "total_products": total,
            "active_products": active,
            "uncovered_products": uncovered,
            "categories": list(per_category),
        })

    @action(
        detail=False,
        methods=["post"],
        url_path="import-csv",
        parser_classes=[MultiPartParser, FormParser],
    )
    @transaction.atomic
    def import_csv(self, request):
        """Import en masse depuis un fichier CSV.

        Colonnes attendues (header obligatoire) :
            name, category_slug, short_description, min_quantity, lead_time_days, tags
        """
        f = request.FILES.get("file")
        if not f:
            return Response({"detail": "Champ 'file' requis"}, status=400)

        try:
            decoded = f.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response({"detail": "Le fichier doit être encodé en UTF-8"}, status=400)

        reader = csv.DictReader(io.StringIO(decoded))
        created, updated, errors = 0, 0, []

        for i, row in enumerate(reader, start=2):  # ligne 1 = header
            name = (row.get("name") or "").strip()
            cat_slug = (row.get("category_slug") or "").strip()
            if not name or not cat_slug:
                errors.append({"line": i, "error": "name et category_slug requis"})
                continue

            category = Category.objects.filter(slug=cat_slug).first()
            if not category:
                errors.append({"line": i, "error": f"Catégorie '{cat_slug}' introuvable"})
                continue

            slug = slugify(name)[:170]
            tags_raw = (row.get("tags") or "").strip()
            tags = [t.strip() for t in tags_raw.split("|") if t.strip()] if tags_raw else []

            defaults = {
                "category": category,
                "name": name,
                "short_description": (row.get("short_description") or "").strip(),
                "min_quantity": int(row.get("min_quantity") or 1),
                "lead_time_days": int(row.get("lead_time_days") or 3),
                "tags": tags,
                "is_active": True,
            }
            product, was_created = Product.objects.update_or_create(
                slug=slug, defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({
            "created": created,
            "updated": updated,
            "errors": errors,
            "total_processed": created + updated + len(errors),
        })
