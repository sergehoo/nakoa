"""Helpers Web Push (VAPID) — envoie de notifications push compatibles iOS 16.4+.

Configuration via settings (env) :
- VAPID_PUBLIC_KEY     : clé publique (base64url, non chiffrée)
- VAPID_PRIVATE_KEY    : clé privée
- VAPID_CLAIM_EMAIL    : adresse mailto utilisée pour identifier le serveur push

Génération initiale des clés (à exécuter une fois) :
    python -c "from py_vapid import Vapid; v = Vapid(); v.generate_keys(); \
        print('PUBLIC:', v.public_key); print('PRIVATE:', v.private_key)"

Ou simplement :
    from py_vapid import Vapid01
    v = Vapid01()
    v.generate_keys()
    pub = v.public_key.public_numbers().x.to_bytes(32, 'big') + v.public_key.public_numbers().y.to_bytes(32, 'big')
    ...

Mais le plus simple : utiliser `pywebpush.WebPush.generate_keys()` côté CLI.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_vapid_config() -> dict[str, str] | None:
    public = getattr(settings, "VAPID_PUBLIC_KEY", "") or ""
    private = getattr(settings, "VAPID_PRIVATE_KEY", "") or ""
    claim_email = getattr(settings, "VAPID_CLAIM_EMAIL", "") or "mailto:tech@nakoahub.com"
    if not public or not private:
        return None
    return {
        "public_key": public,
        "private_key": private,
        "claims": {"sub": claim_email if claim_email.startswith("mailto:") else f"mailto:{claim_email}"},
    }


def get_public_vapid_key() -> str:
    """Retourne la clé publique VAPID à fournir au frontend."""
    return getattr(settings, "VAPID_PUBLIC_KEY", "") or ""


def send_web_push(subscription, payload: dict[str, Any]) -> tuple[bool, str | None]:
    """Envoie un push à une WebPushSubscription.

    Retourne (success, error_message).
    Si pywebpush ou la config VAPID sont absents, l'envoi échoue silencieusement
    (utile en dev / CI).
    """
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.warning("pywebpush non installé — push ignoré.")
        return False, "pywebpush not installed"

    config = _get_vapid_config()
    if not config:
        logger.warning("VAPID_*_KEY non configuré — push ignoré.")
        return False, "VAPID keys missing"

    subscription_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth,
        },
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=config["private_key"],
            vapid_claims=config["claims"].copy(),
            ttl=getattr(settings, "WEB_PUSH_TTL", 60 * 60 * 24),
        )
    except WebPushException as exc:  # type: ignore[misc]
        status = getattr(exc.response, "status_code", None)
        # 404/410 → endpoint expiré, on désactive la souscription
        if status in (404, 410):
            subscription.is_active = False
            subscription.save(update_fields=["is_active", "updated_at"])
            return False, f"expired_endpoint:{status}"
        subscription.failure_count = (subscription.failure_count or 0) + 1
        subscription.save(update_fields=["failure_count", "updated_at"])
        return False, str(exc)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Échec envoi web push pour subscription=%s", subscription.id)
        return False, str(exc)

    subscription.last_used_at = timezone.now()
    subscription.failure_count = 0
    subscription.save(update_fields=["last_used_at", "failure_count", "updated_at"])
    return True, None


def send_web_push_to_user(user, *, title: str, body: str, **extra) -> int:
    """Envoie une notification push à tous les appareils actifs d'un utilisateur.

    Retourne le nombre d'appareils touchés avec succès.
    """
    from .models import WebPushSubscription

    payload = {
        "title": title,
        "body": body,
        "icon": "/icon-192.png",
        "badge": "/icon-72.png",
        **extra,
    }
    subs = WebPushSubscription.objects.filter(user=user, is_active=True)
    count = 0
    for sub in subs:
        ok, _ = send_web_push(sub, payload)
        if ok:
            count += 1
    return count
