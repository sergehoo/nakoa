from django.contrib import admin

from .models import OrderService, PremiumService, ServiceCategory


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "sort_order", "is_active")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("sort_order", "is_active")


@admin.register(PremiumService)
class PremiumServiceAdmin(admin.ModelAdmin):
    list_display = (
        "name", "category", "pricing_type", "base_price", "currency",
        "is_active", "is_visible", "is_required", "sort_order",
    )
    list_filter = ("pricing_type", "is_active", "is_visible", "is_required", "category")
    search_fields = ("name", "code", "description")
    prepopulated_fields = {"code": ("name",)}
    list_editable = ("base_price", "is_active", "is_visible", "sort_order")


@admin.register(OrderService)
class OrderServiceAdmin(admin.ModelAdmin):
    list_display = ("order_id", "service", "quantity", "total", "currency", "status", "created_at")
    list_filter = ("status", "service")
    search_fields = ("order_id",)
    readonly_fields = ("order_id", "service", "quantity", "unit_price", "total", "currency",
                       "created_at", "updated_at")
