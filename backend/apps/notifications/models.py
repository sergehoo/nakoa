"""Notifications multi-canal (email, SMS, push, WhatsApp, in-app)."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Channel(models.TextChoices):
    IN_APP = "in_app", _("In-app")
    EMAIL = "email", _("Email")
    SMS = "sms", _("SMS")
    PUSH = "push", _("Push mobile")
    WHATSAPP = "whatsapp", _("WhatsApp")


class NotificationStatus(models.TextChoices):
    PENDING = "pending", _("En attente")
    SENT = "sent", _("Envoyée")
    DELIVERED = "delivered", _("Délivrée")
    READ = "read", _("Lue")
    FAILED = "failed", _("Échouée")


class NotificationTemplate(BaseModel):
    code = models.CharField(max_length=80, unique=True)
    label = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    default_channels = models.JSONField(default=list, blank=True)
    subject_template = models.CharField(max_length=255, blank=True)
    body_template = models.TextField(blank=True)
    sms_template = models.CharField(max_length=255, blank=True)
    push_title_template = models.CharField(max_length=120, blank=True)
    push_body_template = models.CharField(max_length=255, blank=True)


class WebPushSubscription(BaseModel):
    """Abonnement Web Push d'un utilisateur sur un appareil/navigateur.

    Compatible iOS 16.4+ (Safari) + Chrome/Firefox/Edge Desktop + Android.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    endpoint = models.TextField(unique=True, help_text=_("URL d'endpoint push fournie par le navigateur."))
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)

    user_agent = models.CharField(max_length=500, blank=True, default="")
    label = models.CharField(max_length=120, blank=True, default="",
                             help_text=_("Nom donné par l'utilisateur (ex: iPhone perso)."))
    is_active = models.BooleanField(default=True, db_index=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    failure_count = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = _("Abonnement Web Push")
        verbose_name_plural = _("Abonnements Web Push")
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"WebPush({self.user_id}, {self.endpoint[:40]}…)"


class NotificationType(BaseModel):
    """Type d'événement notifiable, administrable globalement par le Super Admin.

    Le Super Admin peut, depuis le BO :
    - activer/désactiver le type globalement (is_active)
    - choisir les canaux par défaut (default_channels)
    - décider si l'utilisateur peut surcharger (is_user_toggleable)
    """

    code = models.SlugField(_("code"), max_length=80, unique=True, db_index=True)
    label = models.CharField(_("libellé"), max_length=160)
    description = models.TextField(_("description"), blank=True, default="")
    icon = models.CharField(_("icône"), max_length=64, blank=True, default="")

    class Category(models.TextChoices):
        TRANSACTIONAL = "transactional", _("Transactionnel")
        MARKETING = "marketing", _("Marketing")
        SYSTEM = "system", _("Système")
        SECURITY = "security", _("Sécurité")

    category = models.CharField(
        _("catégorie"), max_length=20, choices=Category.choices,
        default=Category.TRANSACTIONAL, db_index=True,
    )

    default_channels = models.JSONField(
        _("canaux par défaut"), default=list, blank=True,
        help_text=_("Liste de codes Channel (in_app, email, sms, push, whatsapp)."),
    )
    is_active = models.BooleanField(_("type actif globalement"), default=True, db_index=True)
    is_user_toggleable = models.BooleanField(
        _("modifiable par l'utilisateur"), default=True,
        help_text=_("Si False, l'utilisateur ne peut pas désactiver ce type."),
    )

    sort_order = models.PositiveIntegerField(default=100, db_index=True)

    class Meta(BaseModel.Meta):
        ordering = ("sort_order", "label")
        verbose_name = _("Type de notification")
        verbose_name_plural = _("Types de notifications")

    def __str__(self) -> str:
        return f"{self.label} ({self.code})"


class UserNotificationPreference(BaseModel):
    """Préférence utilisateur pour un type donné.

    Si absent → fallback sur NotificationType.default_channels.
    Si présent → l'utilisateur a personnalisé : channels = liste effective.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="notification_preferences",
    )
    notification_type = models.ForeignKey(
        NotificationType, on_delete=models.CASCADE, related_name="user_preferences",
    )
    channels = models.JSONField(
        _("canaux activés"), default=list, blank=True,
        help_text=_("Liste vide = type désactivé pour cet utilisateur."),
    )

    class Meta(BaseModel.Meta):
        unique_together = (("user", "notification_type"),)
        verbose_name = _("Préférence notification")
        verbose_name_plural = _("Préférences notifications")
        indexes = [
            models.Index(fields=["user", "notification_type"]),
        ]


class Notification(BaseModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications",
    )
    channel = models.CharField(max_length=16, choices=Channel.choices)
    template_code = models.CharField(max_length=80, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=16, choices=NotificationStatus.choices, default=NotificationStatus.PENDING)
    error = models.CharField(max_length=255, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    external_id = models.CharField(max_length=160, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["recipient", "status", "created_at"]),
            models.Index(fields=["channel", "status"]),
        ]
