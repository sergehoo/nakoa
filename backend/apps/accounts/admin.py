"""Admin Django adapté au User custom (email comme identifiant, pas username)."""

from __future__ import annotations

from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import User, UserAddress, UserDevice, UserPreferences


# ---------------------------------------------------------------------------
# Formulaires admin custom (sans référence au champ username)
# ---------------------------------------------------------------------------
class UserCreationForm(forms.ModelForm):
    """Formulaire de création d'utilisateur via l'admin."""

    password1 = forms.CharField(label="Mot de passe", widget=forms.PasswordInput)
    password2 = forms.CharField(label="Confirmation", widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ("email", "primary_role")

    def clean_password2(self):
        p1 = self.cleaned_data.get("password1")
        p2 = self.cleaned_data.get("password2")
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Les mots de passe ne correspondent pas.")
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """Formulaire de modification d'utilisateur — affiche le hash en lecture seule."""

    password = ReadOnlyPasswordHashField(
        label="Mot de passe",
        help_text=(
            "Les mots de passe sont stockés hashés ; utilisez "
            '<a href="../password/">ce formulaire</a> pour changer le mot de passe.'
        ),
    )

    class Meta:
        model = User
        fields = "__all__"

    def clean_password(self):
        # Champ en lecture seule : on retourne le hash initial.
        return self.initial.get("password")


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    list_display = (
        "email", "full_name", "primary_role", "country",
        "is_active", "kyc_level", "created_at",
    )
    list_filter = ("primary_role", "country", "is_active", "kyc_level", "two_factor_enabled")
    search_fields = ("email", "first_name", "last_name", "phone")
    ordering = ("-created_at",)
    readonly_fields = ("last_login_at", "last_login_ip", "created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("email", "password", "primary_role")}),
        ("Identité", {
            "fields": ("first_name", "last_name", "phone", "avatar", "country", "locale", "timezone"),
        }),
        ("KYC / Sécurité", {
            "fields": (
                "kyc_level", "is_email_verified", "is_phone_verified",
                "two_factor_enabled", "is_suspended", "suspension_reason",
            ),
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        ("Connexions", {
            "fields": ("last_login_at", "last_login_ip", "last_login_user_agent"),
        }),
        ("Métadonnées", {"fields": ("metadata", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "primary_role", "password1", "password2"),
        }),
    )

    def full_name(self, obj):
        return f"{obj.first_name or ''} {obj.last_name or ''}".strip() or "—"
    full_name.short_description = "Nom complet"


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "label", "city", "country", "is_default")
    list_filter = ("kind", "country", "is_default")
    search_fields = ("user__email", "city", "line1", "label")


admin.site.register(UserPreferences)
admin.site.register(UserDevice)
