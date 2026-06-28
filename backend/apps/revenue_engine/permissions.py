"""Permissions DRF du Revenue Engine.

Tout le monde n'a PAS le droit de manipuler la monétisation. On limite les
écritures aux Super Admins (et lectures aux admins).
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission, SAFE_METHODS


def _is_super_admin(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    role = getattr(user, "primary_role", "") or ""
    return role in {"super_admin"}


def _is_admin_staff(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_staff or user.is_superuser:
        return True
    role = getattr(user, "primary_role", "") or ""
    return role in {"admin", "super_admin", "accountant", "support"}


class IsSuperAdmin(BasePermission):
    """Lecture/écriture réservées au Super Administrateur."""

    message = "Réservé au Super Administrateur."

    def has_permission(self, request, view) -> bool:
        return _is_super_admin(request.user)


class IsAdminReadOnlyOrSuperAdmin(BasePermission):
    """Les admins peuvent lire, seul le Super Admin peut écrire."""

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return _is_admin_staff(request.user)
        return _is_super_admin(request.user)
