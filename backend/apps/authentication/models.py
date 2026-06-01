"""Modèles d'authentification : OTP, sessions, codes 2FA backup."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class OTPCode(BaseModel):
    class Purpose(models.TextChoices):
        REGISTRATION = "registration", _("Inscription")
        LOGIN = "login", _("Connexion")
        PHONE_VERIFY = "phone_verify", _("Vérification téléphone")
        EMAIL_VERIFY = "email_verify", _("Vérification email")
        PASSWORD_RESET = "password_reset", _("Réinitialisation MDP")
        SENSITIVE_OP = "sensitive_op", _("Opération sensible")

    class Channel(models.TextChoices):
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"
        WHATSAPP = "whatsapp", "WhatsApp"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.CASCADE, related_name="otp_codes",
    )
    identifier = models.CharField(max_length=160, db_index=True, help_text="email ou téléphone E.164")
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=32, choices=Purpose.choices)
    channel = models.CharField(max_length=16, choices=Channel.choices)
    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=3)
    used_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(db_index=True)
    request_ip = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["identifier", "purpose", "used_at"]),
            models.Index(fields=["expires_at"]),
        ]

    def is_expired(self) -> bool:
        return self.expires_at < timezone.now()

    def is_consumed(self) -> bool:
        return bool(self.used_at)

    @classmethod
    def default_expiry(cls) -> timezone.datetime:
        return timezone.now() + timedelta(minutes=5)


class LoginAttempt(BaseModel):
    """Trace des tentatives de connexion (succès/échec) pour audit + détection brute-force."""

    class Result(models.TextChoices):
        SUCCESS = "success", _("Succès")
        FAILED = "failed", _("Échec")
        BLOCKED = "blocked", _("Bloqué")
        OTP_REQUIRED = "otp_required", _("OTP demandé")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="login_attempts",
    )
    identifier = models.CharField(max_length=160)
    result = models.CharField(max_length=16, choices=Result.choices)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    reason = models.CharField(max_length=160, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["identifier", "result", "created_at"]),
            models.Index(fields=["ip_address", "created_at"]),
        ]


class BackupCode(BaseModel):
    """Codes 2FA de secours (8 codes générés, à usage unique)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="backup_codes",
    )
    code_hash = models.CharField(max_length=128)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["user", "used_at"])]


class OAuthIdentity(BaseModel):
    """Liaison entre un User et un compte OAuth externe (Google, Apple…)."""

    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        APPLE = "apple", "Apple"
        FACEBOOK = "facebook", "Facebook"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="oauth_identities",
    )
    provider = models.CharField(max_length=16, choices=Provider.choices)
    provider_user_id = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_user_id"], name="uq_oauth_provider_uid",
            ),
        ]
