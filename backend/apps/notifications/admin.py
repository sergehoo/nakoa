from django.contrib import admin
from .models import Notification, NotificationTemplate

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "channel", "subject", "status", "sent_at", "read_at")
    list_filter = ("channel", "status")
    search_fields = ("recipient__email", "subject", "template_code")

admin.site.register(NotificationTemplate)
