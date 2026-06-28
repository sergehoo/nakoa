from django.contrib import admin

from .models import CouponCode, CouponRedemption, PromotionCampaign


@admin.register(PromotionCampaign)
class PromotionCampaignAdmin(admin.ModelAdmin):
    list_display = (
        "name", "slug", "status", "discount_type", "discount_value", "currency",
        "starts_at", "ends_at", "usage_count", "is_public",
    )
    list_filter = ("status", "discount_type", "is_public")
    search_fields = ("name", "slug", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("usage_count", "created_at", "updated_at")


@admin.register(CouponCode)
class CouponCodeAdmin(admin.ModelAdmin):
    list_display = (
        "code", "campaign", "redemption_count", "max_redemptions",
        "is_active", "expires_at",
    )
    list_filter = ("campaign", "is_active")
    search_fields = ("code", "campaign__name")
    readonly_fields = ("redemption_count", "created_at", "updated_at")


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = (
        "created_at", "code", "user", "campaign", "discount_amount", "currency", "status",
    )
    list_filter = ("status", "campaign")
    search_fields = ("code__code", "user__email")
    readonly_fields = tuple(f.name for f in CouponRedemption._meta.fields)
