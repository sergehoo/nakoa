from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "invoice_type", "currency"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Invoice.objects.all()
        return Invoice.objects.filter(issued_to=user)
