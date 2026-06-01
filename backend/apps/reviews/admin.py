from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("order", "customer", "printer", "overall_rating", "status", "created_at")
    list_filter = ("status", "overall_rating")
