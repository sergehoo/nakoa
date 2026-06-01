from django.contrib import admin

from .models import (
    DeliveryZone,
    Finish,
    Machine,
    PrinterAgent,
    PrinterProfile,
    ProductionCapability,
)


@admin.register(PrinterProfile)
class PrinterProfileAdmin(admin.ModelAdmin):
    list_display = ("trade_name", "country", "city", "status", "kyc_status", "quality_score", "on_time_rate")
    list_filter = ("status", "kyc_status", "country", "is_featured")
    search_fields = ("trade_name", "legal_name", "city", "rccm_number")


admin.site.register(Machine)
admin.site.register(Finish)
admin.site.register(DeliveryZone)
admin.site.register(ProductionCapability)
admin.site.register(PrinterAgent)
