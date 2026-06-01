from django.contrib import admin
from .models import Carrier, Route, Shipment

admin.site.register(Carrier)
admin.site.register(Shipment)
admin.site.register(Route)
