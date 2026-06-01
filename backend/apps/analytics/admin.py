from django.contrib import admin
from .models import AnalyticsEvent

@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "user", "occurred_at")
    list_filter = ("event_type",)
