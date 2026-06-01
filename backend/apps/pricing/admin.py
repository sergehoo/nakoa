from django.contrib import admin
from .models import PriceGrid, PriceModifier, PriceTier, PromoCode

admin.site.register(PriceGrid)
admin.site.register(PriceTier)
admin.site.register(PriceModifier)
admin.site.register(PromoCode)
