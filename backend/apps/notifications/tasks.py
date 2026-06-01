"""Tâches Celery pour notifications asynchrones."""

from __future__ import annotations

import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone

from .backends import FCMPushBackend, WhatsAppCloudBackend, get_sms_backend
from .models import Channel, Notification, NotificationStatus

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(name="notifications.send_otp_message")
def send_otp_message(otp_id: str, code: str) -> bool:
    from apps.authentication.models import OTPCode

    otp = OTPCode.objects.get(id=otp_id)
    body = f"Votre code PrintHub : {code}. Valable 5 minutes."
    if otp.channel == "sms":
        backend = get_sms_backend()
        backend.send(to=otp.identifier, body=body)
    elif otp.channel == "email":
        send_mail(
            subject="Code de vérification PrintHub",
            message=body,
            from_email=None,
            recipient_list=[otp.identifier],
            fail_silently=True,
        )
    elif otp.channel == "whatsapp":
        WhatsAppCloudBackend().send_template(
            to=otp.identifier, template="otp_code", params=[code],
        )
    return True


@shared_task(name="notifications.notify_user")
def notify_user(user_id: str, kind: str, payload: dict | None = None) -> int:
    """Envoie une notification multi-canal selon les préférences utilisateur."""
    user = User.objects.filter(id=user_id).first()
    if not user:
        return 0
    payload = payload or {}
    prefs = getattr(user, "preferences", None)
    channels = []
    if not prefs or prefs.notify_push:
        channels.append(Channel.PUSH)
    if not prefs or prefs.notify_email:
        channels.append(Channel.EMAIL)
    if prefs and prefs.notify_sms:
        channels.append(Channel.SMS)
    channels.append(Channel.IN_APP)

    sent = 0
    for ch in channels:
        n = Notification.objects.create(
            recipient=user, channel=ch, template_code=kind,
            subject=f"PrintHub — {kind}", body=str(payload),
            payload=payload,
        )
        if _dispatch_notification(n):
            sent += 1
    return sent


def _dispatch_notification(n: Notification) -> bool:
    try:
        if n.channel == Channel.EMAIL:
            send_mail(n.subject, n.body, None, [n.recipient.email], fail_silently=True)
        elif n.channel == Channel.SMS and n.recipient.phone:
            get_sms_backend().send(to=str(n.recipient.phone), body=n.body[:160])
        elif n.channel == Channel.PUSH:
            tokens = list(n.recipient.devices.values_list("fcm_token", flat=True))
            if tokens:
                FCMPushBackend().send(tokens=tokens, title=n.subject, body=n.body[:120], data=n.payload)
        elif n.channel == Channel.WHATSAPP and n.recipient.phone:
            WhatsAppCloudBackend().send_template(
                to=str(n.recipient.phone), template=n.template_code or "default", params=[],
            )
        # In-app : juste persister en base
        n.status = NotificationStatus.SENT
        n.sent_at = timezone.now()
        n.save(update_fields=["status", "sent_at"])
        # Broadcast WS
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            layer = get_channel_layer()
            if layer:
                async_to_sync(layer.group_send)(
                    f"user.{n.recipient_id}",
                    {"type": "notify", "subject": n.subject, "body": n.body, "payload": n.payload},
                )
        except Exception:  # noqa: BLE001
            pass
        return True
    except Exception as exc:  # noqa: BLE001
        logger.exception("Notification %s failed: %s", n.id, exc)
        n.status = NotificationStatus.FAILED
        n.error = str(exc)[:255]
        n.save(update_fields=["status", "error"])
        return False
