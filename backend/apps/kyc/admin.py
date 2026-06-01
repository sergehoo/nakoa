from django.contrib import admin
from .models import KYCDocument, KYCSubmission

@admin.register(KYCSubmission)
class KYCSubmissionAdmin(admin.ModelAdmin):
    list_display = ("user", "type", "status", "submitted_at", "decided_at")
    list_filter = ("status", "type")

admin.site.register(KYCDocument)
