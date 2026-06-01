from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CustomerCompany, CustomerCompanyMember, CustomerProfile
from .serializers import (
    CustomerCompanyMemberSerializer,
    CustomerCompanySerializer,
    CustomerProfileSerializer,
)


class CustomerProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerProfileSerializer

    @action(detail=False, methods=["get", "patch"], url_path="me")
    def me(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(user=request.user)
        if request.method == "PATCH":
            s = self.get_serializer(profile, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            s.save()
            return Response(s.data)
        return Response(self.get_serializer(profile).data)


class CustomerCompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerCompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerCompany.objects.filter(members=self.request.user)


class CustomerCompanyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerCompanyMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerCompanyMember.objects.filter(company__members=self.request.user)
