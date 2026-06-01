from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "resource_type", "resource_id")
    list_filter = ("action", "resource_type")
    search_fields = ("resource_id", "action", "actor__email")
    readonly_fields = [f.name for f in AuditLog._meta.fields]
