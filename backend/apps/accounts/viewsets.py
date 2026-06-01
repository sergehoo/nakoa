from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import UserAddress, UserDevice, UserPreferences
from .serializers import (
    UserAddressSerializer,
    UserDeviceSerializer,
    UserPreferencesSerializer,
    UserSerializer,
)


class MeViewSet(viewsets.ViewSet):
    """Endpoints centrés sur l'utilisateur courant."""

    permission_classes = [IsAuthenticated]

    def list(self, request):
        return Response(UserSerializer(request.user).data)

    def partial_update(self, request, pk=None):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["get", "patch"], url_path="preferences")
    def preferences(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        if request.method == "PATCH":
            serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(UserPreferencesSerializer(prefs).data)


class UserAddressViewSet(viewsets.ModelViewSet):
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, created_by=self.request.user)


class UserDeviceViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = UserDeviceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserDevice.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
