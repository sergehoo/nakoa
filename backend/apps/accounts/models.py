"""Modèle User custom + profils utilisateurs."""

from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField

from apps.core.models import BaseModel, Country, Currency


class Role(models.TextChoices):
    SUPER_ADMIN = "super_admin", _("Super Admin")
    ADMIN = "admin", _("Admin Plateforme")
    SUPPORT = "support", _("Support")
    PRINTER = "printer", _("Imprimeur")
    PRINTER_AGENT = "printer_agent", _("Agent Imprimeur")
    QUALITY_CONTROLLER = "quality_controller", _("Contrôleur Qualité")
    CUSTOMER = "customer", _("Client Particulier")
    CUSTOMER_CORPORATE = "customer_corporate", _("Client Entreprise")
    ACCOUNTANT = "accountant", _("Comptable")
    COURIER = "courier", _("Livreur")


class KYCLevel(models.IntegerChoices):
    VISITOR = 0, _("Visiteur")
    EMAIL_VERIFIED = 1, _("Email vérifié")
    PHONE_VERIFIED = 2, _("Téléphone vérifié")
    IDENTITY_VERIFIED = 3, _("Identité vérifiée")
    ENHANCED = 4, _("Renforcée (entreprise)")


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("primary_role", Role.SUPER_ADMIN)
        extra_fields.setdefault("is_email_verified", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Utilisateur PrintHub — supporte les 10 rôles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True, db_index=True)
    phone = PhoneNumberField(unique=True, null=True, blank=True, db_index=True)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=80, blank=True)

    primary_role = models.CharField(
        max_length=32,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
    )

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    two_factor_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True)

    kyc_level = models.PositiveSmallIntegerField(choices=KYCLevel.choices, default=KYCLevel.VISITOR)

    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    locale = models.CharField(max_length=8, default="fr")
    timezone = models.CharField(max_length=64, default="Africa/Abidjan")
    preferred_currency = models.CharField(max_length=8, choices=Currency.choices, default=Currency.XOF)

    last_login_at = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_user_agent = models.CharField(max_length=255, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    suspension_reason = models.TextField(blank=True)

    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        indexes = [
            models.Index(fields=["primary_role", "is_active"]),
            models.Index(fields=["country", "primary_role"]),
            GinIndex(fields=["metadata"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.email

    @property
    def is_locked(self) -> bool:
        return bool(self.locked_until and self.locked_until > timezone.now())

    @property
    def is_printer(self) -> bool:
        return self.primary_role in {Role.PRINTER, Role.PRINTER_AGENT, Role.QUALITY_CONTROLLER}

    @property
    def is_customer(self) -> bool:
        return self.primary_role in {Role.CUSTOMER, Role.CUSTOMER_CORPORATE}


# ============================================================
# Profils complémentaires
# ============================================================
class UserAddress(BaseModel):
    """Carnet d'adresses utilisateur."""

    class Kind(models.TextChoices):
        SHIPPING = "shipping", _("Livraison")
        BILLING = "billing", _("Facturation")
        PICKUP = "pickup", _("Retrait")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.SHIPPING)
    label = models.CharField(max_length=80, blank=True)
    full_name = models.CharField(max_length=160)
    phone = PhoneNumberField(blank=True)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120)
    region = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country = models.CharField(max_length=8, choices=Country.choices, default=Country.CI)
    landmark = models.CharField(max_length=255, blank=True)
    is_default = models.BooleanField(default=False)
    geo_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    geo_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    class Meta:
        ordering = ["-is_default", "-created_at"]
        indexes = [models.Index(fields=["user", "kind", "is_default"])]


class UserPreferences(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preferences")
    notify_email = models.BooleanField(default=True)
    notify_sms = models.BooleanField(default=True)
    notify_push = models.BooleanField(default=True)
    notify_whatsapp = models.BooleanField(default=False)
    marketing_opt_in = models.BooleanField(default=False)
    dark_mode = models.BooleanField(default=False)


class UserDevice(BaseModel):
    """Appareils enregistrés pour notifications push et 2FA."""

    class Platform(models.TextChoices):
        IOS = "ios", "iOS"
        ANDROID = "android", "Android"
        WEB = "web", "Web"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="devices")
    platform = models.CharField(max_length=16, choices=Platform.choices)
    fcm_token = models.CharField(max_length=255, blank=True)
    name = models.CharField(max_length=120, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "fcm_token"], name="uq_user_fcm"),
        ]
