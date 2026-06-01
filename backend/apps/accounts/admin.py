from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserAddress, UserDevice, UserPreferences


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "full_name", "primary_role", "country", "is_active", "kyc_level", "created_at")
    list_filter = ("primary_role", "country", "is_active", "kyc_level", "two_factor_enabled")
    search_fields = ("email", "first_name", "last_name", "phone")
    ordering = ("-created_at",)
    readonly_fields = ("last_login_at", "last_login_ip", "created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("email", "password", "primary_role")}),
        ("Identité", {"fields": ("first_name", "last_name", "phone", "avatar", "country", "locale", "timezone")}),
        ("KYC / Sécurité", {"fields": ("kyc_level", "is_email_verified", "is_phone_verified", "two_factor_enabled", "is_suspended", "suspension_reason")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Connexions", {"fields": ("last_login_at", "last_login_ip", "last_login_user_agent")}),
        ("Métadonnées", {"fields": ("metadata", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "primary_role"),
        }),
    )


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "label", "city", "country", "is_default")
    list_filter = ("kind", "country", "is_default")
    search_fields = ("user__email", "city", "line1", "label")


admin.site.register(UserPreferences)
admin.site.register(UserDevice)
