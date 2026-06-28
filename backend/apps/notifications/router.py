"""Routeur multi-canal de notifications.

Helper unique `notify(user, type_code, payload, **kwargs)` qui :
1. Vérifie que le type est actif globalement.
2. Résout les canaux effectifs (préférence user ∩ default_channels du type).
3. Crée une Notification par canal et déclenche l'envoi (push / email / SMS).
4. Ignore silencieusement les types inconnus pour ne pas casser l'appelant.

Conçu pour être appelé depuis n'importe quelle app (orders, payments, chat…)
sans avoir à connaître les canaux ni les préférences.
"""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from .models import (
    Channel,
    Notification,
    NotificationStatus,
    NotificationType,
    UserNotificationPreference,
)

logger = logging.getLogger(__name__)


# ============================================================
# Public API
# ============================================================
def notify(
    user,
    type_code: str,
    *,
    subject: str = "",
    body: str = "",
    payload: dict[str, Any] | None = None,
    channels_override: list[str] | None = None,
) -> dict[str, Any]:
    """Envoie une notification à un utilisateur pour un type donné.

    Args:
        user: instance User (recipient).
        type_code: code du NotificationType (ex: ``order.new``).
        subject: titre/objet (push title, email subject).
        body: corps (push body, email body, SMS).
        payload: données structurées (url, order_id…) — passées aux frontends.
        channels_override: force les canaux (utile pour les notifs critiques sécurité).

    Returns:
        dict {channels: list, delivered: int, skipped_reason: str | None}
    """
    payload = payload or {}

    if not user or not getattr(user, "id", None):
        return {"channels": [], "delivered": 0, "skipped_reason": "no_user"}

    try:
        nt = NotificationType.objects.get(code=type_code)
    except NotificationType.DoesNotExist:
        # On crée à la volée pour ne pas perdre la notif, mais inactive par défaut.
        logger.info("NotificationType %r inconnu — création silencieuse inactive.", type_code)
        nt = NotificationType.objects.create(
            code=type_code, label=type_code.replace(".", " ").title(),
            default_channels=["in_app"], is_active=False,
        )

    if not nt.is_active:
        return {"channels": [], "delivered": 0, "skipped_reason": "type_disabled"}

    # Canaux effectifs : override > préférence user > default_channels
    if channels_override is not None:
        channels = channels_override
    else:
        channels = _resolve_user_channels(user, nt)

    # Filtre par disponibilité de l'app (push only si WebPushSubscription, etc.)
    delivered = 0
    used_channels: list[str] = []
    for channel in channels:
        try:
            ok = _dispatch(user, nt, channel, subject=subject, body=body, payload=payload)
            if ok:
                delivered += 1
                used_channels.append(channel)
        except Exception:  # noqa: BLE001
            logger.exception(
                "Échec dispatch %s pour user=%s type=%s", channel, user.id, type_code,
            )

    return {
        "channels": used_channels,
        "delivered": delivered,
        "skipped_reason": None if used_channels else "no_channel",
    }


# ============================================================
# Helpers
# ============================================================
def _resolve_user_channels(user, nt: NotificationType) -> list[str]:
    """Retourne la liste des canaux effectifs pour cet utilisateur.

    Si l'utilisateur a une préférence pour ce type → utilise sa liste.
    Sinon → utilise les default_channels du type.
    Filtre toujours par les canaux valides.
    """
    valid = {c[0] for c in Channel.choices}
    try:
        pref = UserNotificationPreference.objects.get(user=user, notification_type=nt)
        return [c for c in (pref.channels or []) if c in valid]
    except UserNotificationPreference.DoesNotExist:
        return [c for c in (nt.default_channels or []) if c in valid]


def _dispatch(
    user, nt: NotificationType, channel: str,
    *, subject: str, body: str, payload: dict[str, Any],
) -> bool:
    """Crée la Notification et déclenche l'envoi externe selon le canal."""
    notif = Notification.objects.create(
        recipient=user,
        channel=channel,
        template_code=nt.code,
        subject=subject,
        body=body,
        payload=payload,
        status=NotificationStatus.PENDING,
    )

    if channel == Channel.IN_APP:
        # In-app = pas d'envoi externe, juste marquage envoyé
        notif.status = NotificationStatus.SENT
        notif.sent_at = timezone.now()
        notif.save(update_fields=["status", "sent_at", "updated_at"])
        return True

    if channel == Channel.PUSH:
        return _send_push(user, notif, subject, body, payload)

    if channel == Channel.EMAIL:
        return _send_email(user, notif, subject, body, payload)

    if channel == Channel.SMS:
        return _send_sms(user, notif, body)

    # whatsapp / autres : à brancher plus tard
    return False


def _send_push(user, notif: Notification, subject: str, body: str, payload: dict) -> bool:
    try:
        from .web_push import send_web_push_to_user
        count = send_web_push_to_user(
            user, title=subject or "Nakoa", body=body or "",
            data={"url": payload.get("url", "/notifications"), **payload},
        )
        if count > 0:
            notif.status = NotificationStatus.SENT
            notif.sent_at = timezone.now()
            notif.save(update_fields=["status", "sent_at", "updated_at"])
            return True
        notif.status = NotificationStatus.FAILED
        notif.error = "no_active_subscriptions"
        notif.save(update_fields=["status", "error", "updated_at"])
        return False
    except Exception as exc:  # noqa: BLE001
        notif.status = NotificationStatus.FAILED
        notif.error = str(exc)[:255]
        notif.save(update_fields=["status", "error", "updated_at"])
        return False


def _send_email(user, notif: Notification, subject: str, body: str, payload: dict) -> bool:
    try:
        from django.core.mail import EmailMessage
        msg = EmailMessage(
            subject=subject or "Nakoa",
            body=body or "",
            to=[user.email],
        )
        msg.send(fail_silently=False)
        notif.status = NotificationStatus.SENT
        notif.sent_at = timezone.now()
        notif.save(update_fields=["status", "sent_at", "updated_at"])
        return True
    except Exception as exc:  # noqa: BLE001
        notif.status = NotificationStatus.FAILED
        notif.error = str(exc)[:255]
        notif.save(update_fields=["status", "error", "updated_at"])
        return False


def _send_sms(user, notif: Notification, body: str) -> bool:
    # Stub — à brancher sur le provider SMS de prod
    phone = getattr(user, "phone", None)
    if not phone:
        notif.status = NotificationStatus.FAILED
        notif.error = "no_phone"
        notif.save(update_fields=["status", "error", "updated_at"])
        return False
    # TODO: brancher Twilio / Africa's Talking / Orange SMS API
    logger.info("[SMS stub] %s → %s : %s", phone, body[:30], body)
    notif.status = NotificationStatus.SENT
    notif.sent_at = timezone.now()
    notif.save(update_fields=["status", "sent_at", "updated_at"])
    return True
