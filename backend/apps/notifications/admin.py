from django.contrib import admin
from .models import (
    Notification, NotificationTemplate, NotificationType,
    UserNotificationPreference, WebPushSubscription,
)


@admin.register(NotificationType)
class NotificationTypeAdmin(admin.ModelAdmin):
    list_display = (
        "label", "code", "category", "is_active", "is_user_toggleable", "sort_order",
    )
    list_filter = ("category", "is_active", "is_user_toggleable")
    search_fields = ("code", "label", "description")
    list_editable = ("is_active", "is_user_toggleable", "sort_order")
    prepopulated_fields = {"code": ("label",)}


@admin.register(UserNotificationPreference)
class UserNotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "channels", "updated_at")
    list_filter = ("notification_type",)
    search_fields = ("user__email", "notification_type__code")
    readonly_fields = ("created_at", "updated_at")

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "channel", "subject", "status", "sent_at", "read_at")
    list_filter = ("channel", "status")
    search_fields = ("recipient__email", "subject", "template_code")

admin.site.register(NotificationTemplate)


@admin.register(WebPushSubscription)
class WebPushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "label", "is_active", "failure_count", "last_used_at", "created_at")
    list_filter = ("is_active",)
    search_fields = ("user__email", "label", "endpoint")
    readonly_fields = ("endpoint", "p256dh", "auth", "user_agent", "last_used_at",
                       "failure_count", "created_at", "updated_at")
