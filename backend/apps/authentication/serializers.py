from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role
from apps.core.exceptions import BusinessRuleViolation

from .services import verify_2fa

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10, validators=[validate_password])
    # Champs optionnels pour les rôles pro (printer / customer_corporate). Write-only :
    # n'apparaissent pas dans la réponse et n'existent pas sur User.
    legal_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)
    trade_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=255)
    city = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=160)

    class Meta:
        model = User
        fields = [
            "email", "phone", "first_name", "last_name", "password",
            "country", "locale", "primary_role",
            "legal_name", "trade_name", "city",
        ]
        extra_kwargs = {
            "primary_role": {"required": False, "default": Role.CUSTOMER},
        }

    def validate_primary_role(self, value):
        allowed = {Role.CUSTOMER, Role.CUSTOMER_CORPORATE, Role.PRINTER, Role.COURIER}
        if value and value not in allowed:
            raise serializers.ValidationError("Rôle non autorisé à l'inscription publique.")
        return value or Role.CUSTOMER

    def validate(self, attrs):
        # Pour les rôles pro, la raison sociale est obligatoire.
        role = attrs.get("primary_role") or Role.CUSTOMER
        if role in {Role.PRINTER, Role.CUSTOMER_CORPORATE}:
            if not (attrs.get("legal_name") or "").strip():
                raise serializers.ValidationError(
                    {"legal_name": "La raison sociale est requise pour ce type de compte."}
                )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        legal_name = (validated_data.pop("legal_name", "") or "").strip()
        trade_name = (validated_data.pop("trade_name", "") or "").strip()
        city = (validated_data.pop("city", "") or "").strip()

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Enrichit le PrinterProfile auto-créé par le signal (apps/printers/signals.py).
        if user.primary_role == Role.PRINTER and (legal_name or trade_name or city):
            try:
                from apps.printers.models import PrinterProfile

                profile = PrinterProfile.objects.filter(owner=user).first()
                if profile:
                    update_fields = []
                    if legal_name:
                        profile.legal_name = legal_name
                        update_fields.append("legal_name")
                    if trade_name:
                        profile.trade_name = trade_name
                        update_fields.append("trade_name")
                    if city and hasattr(profile, "city"):
                        profile.city = city
                        update_fields.append("city")
                    if update_fields:
                        profile.save(update_fields=update_fields)
            except Exception:  # noqa: BLE001
                # Pas bloquant : l'utilisateur peut compléter dans son onboarding KYB.
                pass
        return user


class OTPRequestSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=160)
    channel = serializers.ChoiceField(choices=["sms", "email", "whatsapp"], default="sms")
    purpose = serializers.ChoiceField(
        choices=["registration", "login", "phone_verify", "email_verify", "password_reset", "sensitive_op"]
    )


class OTPVerifySerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=160)
    code = serializers.CharField(min_length=4, max_length=8)
    purpose = serializers.CharField()


class PrintHubTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login enrichi : gère 2FA et compte verrouillé."""

    two_factor_code = serializers.CharField(required=False, allow_blank=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["primary_role"] = user.primary_role
        token["kyc_level"] = user.kyc_level
        return token

    def validate(self, attrs):
        otp = attrs.pop("two_factor_code", "")
        data = super().validate(attrs)
        user = self.user

        if user.is_locked:
            raise BusinessRuleViolation("Compte temporairement verrouillé, réessayez plus tard.")
        if user.is_suspended:
            raise BusinessRuleViolation("Compte suspendu. Contactez le support.")
        if user.two_factor_enabled:
            if not otp:
                raise BusinessRuleViolation("Code 2FA requis.")
            if not verify_2fa(user, otp):
                raise BusinessRuleViolation("Code 2FA invalide.")

        data["user"] = {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "primary_role": user.primary_role,
            "kyc_level": user.kyc_level,
            "two_factor_enabled": user.two_factor_enabled,
        }
        return data


class PasswordResetSerializer(serializers.Serializer):
    identifier = serializers.CharField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    code = serializers.CharField()
    new_password = serializers.CharField(min_length=10, validators=[validate_password])


class TOTPSetupSerializer(serializers.Serializer):
    pass  # POST seul — déclenche la génération


class TOTPConfirmSerializer(serializers.Serializer):
    code = serializers.CharField(min_length=6, max_length=8)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def save(self, **kwargs):
        try:
            RefreshToken(self.validated_data["refresh"]).blacklist()
        except Exception as exc:  # noqa: BLE001
            raise BusinessRuleViolation("Refresh token invalide.") from exc
