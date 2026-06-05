from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .admin_viewsets import AdminCategoryViewSet, AdminProductViewSet
from .viewsets import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

# Routes admin séparées (préfixe /admin/)
admin_router = DefaultRouter()
admin_router.register("categories", AdminCategoryViewSet, basename="admin-category")
admin_router.register("products", AdminProductViewSet, basename="admin-product")

urlpatterns = [
    path("admin/", include(admin_router.urls)),
    *router.urls,
]
