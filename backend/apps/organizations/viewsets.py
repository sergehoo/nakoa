from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Organization, OrganizationMember
from .serializers import OrganizationMemberSerializer, OrganizationSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(members=self.request.user)


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated]
    queryset = OrganizationMember.objects.all()
