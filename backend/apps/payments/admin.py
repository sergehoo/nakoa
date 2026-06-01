from django.contrib import admin
from .models import Payment, Payout, Refund, WalletTransaction


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "order", "provider", "amount", "currency", "status", "captured_at")
    list_filter = ("provider", "status", "currency")
    search_fields = ("reference", "provider_reference", "order__reference")


admin.site.register(Refund)
admin.site.register(WalletTransaction)
admin.site.register(Payout)
