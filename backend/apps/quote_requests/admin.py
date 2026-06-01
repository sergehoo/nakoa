from django.contrib import admin
from .models import QuoteOffer, QuoteRequest


@admin.register(QuoteRequest)
class QuoteRequestAdmin(admin.ModelAdmin):
    list_display = ("reference", "customer", "product", "quantity", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("reference", "customer__email")


@admin.register(QuoteOffer)
class QuoteOfferAdmin(admin.ModelAdmin):
    list_display = ("request", "printer", "tag", "total_incl_tax", "score", "is_ai_recommended")
    list_filter = ("tag", "is_ai_recommended")
