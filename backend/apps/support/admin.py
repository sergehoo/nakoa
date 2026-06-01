from django.contrib import admin
from .models import Ticket, TicketMessage

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ("reference", "subject", "requester", "assignee", "priority", "status", "created_at")
    list_filter = ("status", "priority", "category")
    search_fields = ("reference", "subject", "requester__email")

admin.site.register(TicketMessage)
