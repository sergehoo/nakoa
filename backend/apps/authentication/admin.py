from django.contrib import admin

from .models import BackupCode, LoginAttempt, OAuthIdentity, OTPCode


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ("identifier", "purpose", "channel", "attempts", "used_at", "expires_at", "created_at")
    list_filter = ("purpose", "channel", "used_at")
    search_fields = ("identifier", "user__email")
    readonly_fields = ("code_hash",)


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("identifier", "result", "ip_address", "created_at")
    list_filter = ("result",)
    search_fields = ("identifier", "ip_address")


admin.site.register(BackupCode)
admin.site.register(OAuthIdentity)
