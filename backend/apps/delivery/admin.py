from django.contrib import admin
from .models import DeliveryAssignment, DeliveryProof, GPSPoint

admin.site.register(DeliveryAssignment)
admin.site.register(DeliveryProof)
admin.site.register(GPSPoint)
