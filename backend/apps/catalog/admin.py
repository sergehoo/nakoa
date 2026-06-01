from django.contrib import admin

from .models import (
    Category,
    Product,
    ProductImage,
    ProductOption,
    ProductOptionValue,
    ProductTemplate,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "is_active", "position")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}


class ProductOptionInline(admin.TabularInline):
    model = ProductOption


class ProductImageInline(admin.TabularInline):
    model = ProductImage


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "is_active", "is_featured", "lead_time_days", "min_quantity")
    list_filter = ("category", "is_active", "is_featured")
    search_fields = ("name", "slug", "tags")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductOptionInline, ProductImageInline]


admin.site.register(ProductOption)
admin.site.register(ProductOptionValue)
admin.site.register(ProductImage)
admin.site.register(ProductTemplate)
