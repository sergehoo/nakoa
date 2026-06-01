from django.contrib import admin

from .models import Order, OrderItem, OrderStatusHistory


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer", "printer", "product", "status", "total_incl_tax", "created_at")
    list_filter = ("status", "currency", "delivery_country")
    search_fields = ("reference", "customer__email", "printer__trade_name")


admin.site.register(OrderItem)
admin.site.register(OrderStatusHistory)
