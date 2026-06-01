"""WhatsApp-first ordering — handler webhook Meta + assistant conversationnel.

Flow :
1. Client envoie message au numéro WhatsApp Business
2. Webhook reçu sur /api/v1/webhooks/whatsapp/
3. Routing : nouveau client → registration flow, existant → assistant IA
4. L'assistant IA pose les bonnes questions (produit, quantité, délai)
5. Si BAT envoyé → upload S3 + analyse IA + rapport renvoyé en chat
6. Génération de devis → bouton "Payer maintenant" avec lien CinetPay/Wave
7. Suivi commande poussé automatiquement aux jalons clés
"""

from __future__ import annotations

import json
import logging
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

WHATSAPP_API = "https://graph.facebook.com/v19.0"


def verify_webhook_token(mode: str, token: str, challenge: str) -> str | None:
    """Vérification initiale du webhook (handshake Meta)."""
    if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
        return challenge
    return None


def send_text(to: str, body: str) -> dict:
    """Envoie un message texte simple."""
    return _send({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": body},
    })


def send_interactive_buttons(to: str, body: str, buttons: list[dict]) -> dict:
    """Envoie un message avec boutons interactifs (max 3)."""
    return _send({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
                    for b in buttons[:3]
                ],
            },
        },
    })


def send_template(to: str, template_name: str, params: list[str], lang: str = "fr") -> dict:
    """Envoie un template approuvé (notifications transactionnelles)."""
    return _send({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": lang},
            "components": [{
                "type": "body",
                "parameters": [{"type": "text", "text": p} for p in params],
            }],
        },
    })


def send_document(to: str, document_url: str, filename: str, caption: str = "") -> dict:
    return _send({
        "messaging_product": "whatsapp",
        "to": to,
        "type": "document",
        "document": {"link": document_url, "filename": filename, "caption": caption},
    })


def _send(payload: dict) -> dict:
    phone_id = settings.WHATSAPP_PHONE_NUMBER_ID
    token = settings.WHATSAPP_ACCESS_TOKEN
    if not phone_id or not token:
        logger.warning("WhatsApp non configuré")
        return {"sent": False}
    try:
        r = requests.post(
            f"{WHATSAPP_API}/{phone_id}/messages",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
            timeout=10,
        )
        return r.json()
    except Exception as exc:  # noqa: BLE001
        logger.exception("WhatsApp send failed: %s", exc)
        return {"sent": False, "error": str(exc)}


def handle_inbound_message(payload: dict) -> dict:
    """Traite un message entrant WhatsApp et déclenche la conversation IA."""
    try:
        entry = payload.get("entry", [{}])[0]
        change = entry.get("changes", [{}])[0]
        value = change.get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return {"status": "no_message"}

        message = messages[0]
        from_phone = message.get("from")
        msg_type = message.get("type")
        msg_id = message.get("id")

        # Idempotence
        from apps.notifications.models import Notification
        if Notification.objects.filter(external_id=msg_id).exists():
            return {"status": "duplicate"}

        if msg_type == "text":
            text = message["text"]["body"]
            return _handle_text(from_phone, text, msg_id)
        elif msg_type == "interactive":
            button_id = message["interactive"]["button_reply"]["id"]
            return _handle_button(from_phone, button_id, msg_id)
        elif msg_type == "document":
            return _handle_document(from_phone, message["document"], msg_id)
        elif msg_type == "image":
            return _handle_image(from_phone, message["image"], msg_id)

        return {"status": "unsupported_type", "type": msg_type}
    except Exception as exc:  # noqa: BLE001
        logger.exception("WhatsApp inbound handler failed: %s", exc)
        return {"status": "error", "error": str(exc)}


def _handle_text(from_phone: str, text: str, msg_id: str) -> dict:
    """Route le texte vers l'assistant IA ou la création de compte."""
    from django.contrib.auth import get_user_model
    from apps.ai_assistant.models import AssistantConversation
    from apps.ai_assistant.services import reply_in_conversation

    User = get_user_model()
    user = User.objects.filter(phone=f"+{from_phone}").first()

    if not user:
        # Onboarding express : on crée un compte client de base
        import secrets
        user = User.objects.create_user(
            email=f"wa-{from_phone}@whatsapp.printhub.io",
            password=secrets.token_urlsafe(20),
            phone=f"+{from_phone}",
            primary_role="customer",
            is_phone_verified=True,
        )
        send_text(from_phone,
            "👋 Bienvenue chez PrintHub !\n\n"
            "Je suis l'assistant IA. Dis-moi simplement ce que tu veux imprimer "
            "(ex : « 500 flyers A5 pour vendredi ») et je m'occupe de tout.\n\n"
            "💳 Paiement sécurisé Wave, Orange Money, MTN MoMo.\n"
            "📦 Livraison tracée en temps réel.\n"
            "🛡 Garantie qualité PrintHub Care incluse.",
        )
        return {"status": "new_user_created"}

    # Conversation IA existante ou nouvelle
    conv, _ = AssistantConversation.objects.get_or_create(
        user=user,
        is_archived=False,
        defaults={"persona": "customer", "title": "WhatsApp", "context": {"channel": "whatsapp"}},
    )
    reply = reply_in_conversation(conversation=conv, user_text=text, user=user)
    send_text(from_phone, reply.content)

    # Trace
    from apps.notifications.models import Channel, Notification, NotificationStatus
    Notification.objects.create(
        recipient=user, channel=Channel.WHATSAPP,
        subject="WhatsApp inbound", body=text[:255], external_id=msg_id,
        status=NotificationStatus.DELIVERED,
    )
    return {"status": "replied"}


def _handle_button(from_phone: str, button_id: str, msg_id: str) -> dict:
    """Traite un click sur bouton interactif (paiement, sélection offre…)."""
    if button_id.startswith("pay_order_"):
        order_id = button_id.replace("pay_order_", "")
        # TODO : générer lien CinetPay + envoyer
        send_text(from_phone, f"💳 Lien de paiement : https://pay.printhub.io/{order_id}")
    elif button_id.startswith("accept_offer_"):
        offer_id = button_id.replace("accept_offer_", "")
        send_text(from_phone, f"✅ Offre {offer_id} acceptée. Procédez au paiement.")
    return {"status": "button_handled"}


def _handle_document(from_phone: str, document: dict, msg_id: str) -> dict:
    """Document reçu (BAT) → téléchargement + analyse IA."""
    media_id = document.get("id")
    filename = document.get("filename", "bat.pdf")
    send_text(from_phone,
        f"📄 J'ai bien reçu *{filename}*. J'analyse maintenant la qualité d'impression…",
    )
    # TODO : télécharger via /v19.0/{media_id} puis lancer analyze_bat_task
    return {"status": "document_queued", "media_id": media_id}


def _handle_image(from_phone: str, image: dict, msg_id: str) -> dict:
    send_text(from_phone,
        "🖼 Image reçue. Pour une analyse précise, envoie de préférence un PDF haute résolution.",
    )
    return {"status": "image_acknowledged"}
