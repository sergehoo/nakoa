from django.contrib import admin
from .models import ProductionIncident, ProductionJob, ProductionPhoto, ProductionStep

@admin.register(ProductionJob)
class ProductionJobAdmin(admin.ModelAdmin):
    list_display = ("reference", "order", "printer", "status", "priority", "started_at", "completed_at")
    list_filter = ("status", "priority")

admin.site.register(ProductionStep)
admin.site.register(ProductionIncident)
admin.site.register(ProductionPhoto)
