from django.db import transaction
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import PaymentMethod, UserAddress, UserDevice, UserPreferences
from .serializers import (
    PaymentMethodSerializer,
    UserAddressSerializer,
    UserDeviceSerializer,
    UserPreferencesSerializer,
    UserSerializer,
)


class MeViewSet(viewsets.ViewSet):
    """Endpoints centrés sur l'utilisateur courant.

    - GET    /accounts/me/             → profil
    - PATCH  /accounts/me/             → mise à jour profil
    - GET    /accounts/me/preferences/ → préférences notif
    - PATCH  /accounts/me/preferences/ → mise à jour préférences
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        return Response(UserSerializer(request.user).data)

    def update(self, request, pk=None):
        return self.partial_update(request, pk)

    def partial_update(self, request, pk=None):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # Fallback : PATCH /accounts/me/ sans pk (routeur DRF ne mappe pas par défaut PATCH sur list)
    def get_extra_actions(self):
        return super().get_extra_actions()

    @action(detail=False, methods=["patch"], url_path="update")
    def update_me(self, request):
        return self.partial_update(request)

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
        instance = serializer.save(user=self.request.user, created_by=self.request.user)
        if instance.is_default:
            self._unset_other_defaults(instance)

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        if instance.is_default:
            self._unset_other_defaults(instance)

    @action(detail=True, methods=["post"], url_path="set-default")
    @transaction.atomic
    def set_default(self, request, pk=None):
        instance = self.get_object()
        instance.is_default = True
        instance.save(update_fields=["is_default"])
        self._unset_other_defaults(instance)
        return Response(self.get_serializer(instance).data)

    def _unset_other_defaults(self, instance):
        UserAddress.objects.filter(
            user=instance.user, kind=instance.kind, is_default=True,
        ).exclude(pk=instance.pk).update(is_default=False)


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


class PaymentMethodViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user, created_by=self.request.user)
        if instance.is_default:
            self._unset_other_defaults(instance)

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        if instance.is_default:
            self._unset_other_defaults(instance)

    @action(detail=True, methods=["post"], url_path="set-default")
    @transaction.atomic
    def set_default(self, request, pk=None):
        instance = self.get_object()
        instance.is_default = True
        instance.save(update_fields=["is_default"])
        self._unset_other_defaults(instance)
        return Response(self.get_serializer(instance).data)

    def _unset_other_defaults(self, instance):
        PaymentMethod.objects.filter(
            user=instance.user, is_default=True,
        ).exclude(pk=instance.pk).update(is_default=False)
