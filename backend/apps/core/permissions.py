"""Permissions DRF réutilisables."""

from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """L'objet possède un attribut user / customer / printer pointant vers l'utilisateur."""

    owner_field = "user"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner == request.user


class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsPrinterMember(BasePermission):
    """Réservé aux comptes liés à un PrinterProfile."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "primary_role", None) in {"printer", "printer_agent"})


class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "primary_role", None) in {"customer", "customer_corporate"})


class IsCourier(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "primary_role", None) == "courier")
