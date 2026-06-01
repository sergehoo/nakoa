"""Backends concrets pour envoi SMS / WhatsApp / Push (interface unifiée)."""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


class BaseSMSBackend:
    def send(self, *, to: str, body: str, sender_id: str = "") -> dict[str, Any]:
        raise NotImplementedError


class ConsoleSMSBackend(BaseSMSBackend):
    """Affiche les SMS dans les logs en dev."""

    def send(self, *, to, body, sender_id=""):
        logger.info("[SMS console] to=%s sender=%s body=%s", to, sender_id, body)
        return {"status": "ok", "id": "console"}


class AfricasTalkingBackend(BaseSMSBackend):
    """Africa's Talking — couvre la zone UEMOA."""

    API_URL = "https://api.africastalking.com/version1/messaging"

    def send(self, *, to, body, sender_id=""):
        import requests
        headers = {
            "apiKey": settings.AFRICASTALKING_API_KEY,
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "username": settings.AFRICASTALKING_USERNAME,
            "to": to,
            "message": body,
            "from": sender_id or settings.AFRICASTALKING_SENDER_ID,
        }
        try:
            r = requests.post(self.API_URL, headers=headers, data=data, timeout=10)
            return r.json()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Africa's Talking send failed: %s", exc)
            return {"status": "failed", "error": str(exc)}


class WhatsAppCloudBackend:
    """Meta WhatsApp Cloud API."""

    def send_template(self, *, to: str, template: str, params: list[str]):
        import requests
        url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template, "language": {"code": "fr"},
                "components": [{"type": "body", "parameters": [{"type": "text", "text": p} for p in params]}],
            },
        }
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=10)
            return r.json()
        except Exception as exc:  # noqa: BLE001
            return {"status": "failed", "error": str(exc)}


class FCMPushBackend:
    """Firebase Cloud Messaging — push iOS/Android/Web."""

    URL = "https://fcm.googleapis.com/fcm/send"

    def send(self, *, tokens: list[str], title: str, body: str, data: dict | None = None):
        import requests
        headers = {
            "Authorization": f"key={settings.FCM_SERVER_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "registration_ids": tokens,
            "notification": {"title": title, "body": body},
            "data": data or {},
        }
        try:
            r = requests.post(self.URL, headers=headers, json=payload, timeout=10)
            return r.json()
        except Exception as exc:  # noqa: BLE001
            return {"status": "failed", "error": str(exc)}


def get_sms_backend() -> BaseSMSBackend:
    from importlib import import_module
    module_path, klass_name = settings.SMS_BACKEND.rsplit(".", 1)
    klass = getattr(import_module(module_path), klass_name)
    return klass()
