from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import CRMActivity, Lead
from .serializers import CRMActivitySerializer, LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["kind", "stage", "country", "owner"]
    search_fields = ["full_name", "company", "email"]


class CRMActivityViewSet(viewsets.ModelViewSet):
    queryset = CRMActivity.objects.all()
    serializer_class = CRMActivitySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["lead", "kind", "owner"]
