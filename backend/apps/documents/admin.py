from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("kind", "file_name", "uploaded_by", "size_bytes", "created_at")
    list_filter = ("kind",)
