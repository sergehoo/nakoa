from rest_framework import viewsets
from rest_framework.permissions import AllowAny

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
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related(
        "options__values", "images", "templates",
    )
    permission_classes = [AllowAny]
    lookup_field = "slug"
    filterset_fields = ["category", "is_featured"]
    search_fields = ["name", "short_description", "tags"]
    ordering_fields = ["sort_order", "lead_time_days", "created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer
