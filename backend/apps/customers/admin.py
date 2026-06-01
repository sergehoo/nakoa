from django.contrib import admin
from .models import CustomerCompany, CustomerCompanyMember, CustomerProfile

@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "segment", "country", "total_orders", "lifetime_value", "last_order_at")
    list_filter = ("segment", "country")
    search_fields = ("user__email", "company_name")

admin.site.register(CustomerCompany)
admin.site.register(CustomerCompanyMember)
