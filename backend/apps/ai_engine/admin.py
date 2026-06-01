from django.contrib import admin
from .models import AICallLog, BATAnalysis, PromptTemplate

@admin.register(AICallLog)
class AICallLogAdmin(admin.ModelAdmin):
    list_display = ("feature", "provider", "model", "success", "tokens_in", "tokens_out", "latency_ms", "created_at")
    list_filter = ("provider", "success", "feature")
    search_fields = ("feature", "model")

admin.site.register(BATAnalysis)
admin.site.register(PromptTemplate)
