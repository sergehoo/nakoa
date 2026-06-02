"""Services d'authentification — OTP, 2FA, OAuth.

Note : ce package supplante le fichier ``services.py`` historique (collision de nom).
Lorsque Python rencontre à la fois un module ``services.py`` et un package
``services/``, le package gagne. Tout le code utile est donc ici. Le fichier
``services.py`` doit être supprimé (`git rm apps/authentication/services.py`).
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import timedelta

import pyotp
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from apps.core.exceptions import BusinessRuleViolation, RateLimited
from apps.core.utils import generate_otp

from ..models import BackupCode, LoginAttempt, OAuthIdentity, OTPCode

User = get_user_model()


# ============================================================
# OTP
# ============================================================
def _hash_code(code: str) -> str:
    salt = settings.SECRET_KEY[:16]
    return hashlib.sha256(f"{salt}:{code}".encode()).hexdigest()


def issue_otp(
    *,
    identifier: str,
    purpose: str,
    channel: str = "sms",
    user=None,
    request_ip: str | None = None,
) -> OTPCode:
    """Crée un OTP, l'enregistre et déclenche son envoi (async)."""

    recent = OTPCode.objects.filter(
        identifier=identifier,
        created_at__gte=timezone.now() - timedelta(minutes=5),
    ).count()
    if recent >= 3:
        raise RateLimited("Trop de demandes d'OTP, attendez 5 minutes.")

    code = generate_otp(6)
    otp = OTPCode.objects.create(
        user=user,
        identifier=identifier,
        code_hash=_hash_code(code),
        purpose=purpose,
        channel=channel,
        expires_at=OTPCode.default_expiry(),
        request_ip=request_ip,
    )
    from apps.notifications.tasks import send_otp_message
    send_otp_message.delay(otp_id=str(otp.id), code=code)
    return otp


def verify_otp(*, identifier: str, code: str, purpose: str) -> OTPCode:
    """Vérifie un OTP. Lève BusinessRuleViolation si invalide."""

    otp = (
        OTPCode.objects
        .filter(identifier=identifier, purpose=purpose, used_at__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if not otp:
        raise BusinessRuleViolation("Aucun code en attente pour cet identifiant.")
    if otp.is_expired():
        raise BusinessRuleViolation("Code expiré, redemandez un nouveau code.")
    if otp.attempts >= otp.max_attempts:
        raise BusinessRuleViolation("Trop d'essais — redemandez un nouveau code.")
    if otp.code_hash != _hash_code(code):
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        raise BusinessRuleViolation("Code invalide.")
    otp.used_at = timezone.now()
    otp.save(update_fields=["used_at"])
    return otp


# ============================================================
# 2FA TOTP
# ============================================================
def enable_2fa(user) -> tuple[str, str, list[str]]:
    """Génère un secret TOTP + URL provisioning + codes de secours."""

    secret = pyotp.random_base32()
    issuer = "PrintHub"
    uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name=issuer)

    backup_codes = [secrets.token_hex(4) for _ in range(10)]
    BackupCode.objects.filter(user=user, used_at__isnull=True).delete()
    BackupCode.objects.bulk_create([
        BackupCode(user=user, code_hash=make_password(c)) for c in backup_codes
    ])

    user.totp_secret = secret
    user.save(update_fields=["totp_secret"])
    return secret, uri, backup_codes


def confirm_2fa(user, otp: str) -> None:
    if not user.totp_secret:
        raise BusinessRuleViolation("Le 2FA n'est pas configuré.")
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(otp, valid_window=1):
        raise BusinessRuleViolation("Code 2FA invalide.")
    user.two_factor_enabled = True
    user.save(update_fields=["two_factor_enabled"])


def verify_2fa(user, otp: str) -> bool:
    if user.totp_secret and pyotp.TOTP(user.totp_secret).verify(otp, valid_window=1):
        return True
    for bc in user.backup_codes.filter(used_at__isnull=True):
        if check_password(otp, bc.code_hash):
            bc.used_at = timezone.now()
            bc.save(update_fields=["used_at"])
            return True
    return False


# ============================================================
# OAuth
# ============================================================
def upsert_oauth_identity(*, provider: str, provider_user_id: str, email: str, payload: dict):
    """Crée/récupère le compte utilisateur lié à une identité OAuth."""

    identity = OAuthIdentity.objects.filter(
        provider=provider, provider_user_id=provider_user_id,
    ).select_related("user").first()
    if identity:
        return identity.user, False

    user = User.objects.filter(email__iexact=email).first()
    created = False
    if not user:
        user = User.objects.create_user(
            email=email,
            password=secrets.token_urlsafe(32),
            is_email_verified=True,
        )
        created = True
    OAuthIdentity.objects.create(
        user=user, provider=provider, provider_user_id=provider_user_id,
        email=email, raw_payload=payload,
    )
    return user, created


# ============================================================
# Login attempts
# ============================================================
def record_login(*, user, identifier, result, ip, ua, reason=""):
    LoginAttempt.objects.create(
        user=user, identifier=identifier, result=result,
        ip_address=ip, user_agent=ua[:255], reason=reason,
    )
    if user and result == LoginAttempt.Result.FAILED:
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = timezone.now() + timedelta(minutes=15)
        user.save(update_fields=["failed_login_attempts", "locked_until"])
    if user and result == LoginAttempt.Result.SUCCESS:
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = timezone.now()
        user.last_login_ip = ip
        user.last_login_user_agent = ua[:255]
        user.save(update_fields=[
            "failed_login_attempts", "locked_until", "last_login_at",
            "last_login_ip", "last_login_user_agent",
        ])


__all__ = [
    "issue_otp",
    "verify_otp",
    "enable_2fa",
    "confirm_2fa",
    "verify_2fa",
    "upsert_oauth_identity",
    "record_login",
]
