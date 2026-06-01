from django.contrib import admin
from .models import Invoice, InvoiceLine

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "invoice_type", "issued_to", "total", "currency", "status", "issued_at")
    list_filter = ("invoice_type", "status", "currency")
    search_fields = ("number",)

admin.site.register(InvoiceLine)
