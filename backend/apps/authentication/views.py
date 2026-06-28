from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.core.exceptions import BusinessRuleViolation

from .serializers import (
    LogoutSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    PrintHubTokenObtainPairSerializer,
    RegisterSerializer,
    TOTPConfirmSerializer,
)
from .services import (
    confirm_2fa,
    enable_2fa,
    issue_otp,
    record_login,
    verify_otp,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # OTP de vérification email automatique
        issue_otp(
            identifier=user.email, purpose="email_verify",
            channel="email", user=user,
            request_ip=self.request.META.get("REMOTE_ADDR"),
        )


class LoginView(TokenObtainPairView):
    """Login JWT enrichi 2FA + vérification email + comptes suspendus."""

    serializer_class = PrintHubTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        identifier = request.data.get("email", "") or ""
        ip = request.META.get("REMOTE_ADDR")
        ua = request.META.get("HTTP_USER_AGENT", "")

        # Vérifications pré-authentification (avant de générer un token JWT)
        candidate = User.objects.filter(email__iexact=identifier).first()
        if candidate:
            # 1. Compte suspendu / désactivé
            if candidate.is_suspended:
                record_login(
                    user=candidate, identifier=identifier, result="failed",
                    ip=ip, ua=ua, reason="suspended",
                )
                return Response(
                    {
                        "detail": "Votre compte a été suspendu.",
                        "reason": "account_suspended",
                        "suspension_reason": candidate.suspension_reason or "",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # 2. Compte verrouillé (trop d'échecs récents)
            if candidate.locked_until and candidate.locked_until > timezone.now():
                minutes_left = int(
                    (candidate.locked_until - timezone.now()).total_seconds() / 60
                ) + 1
                record_login(
                    user=candidate, identifier=identifier, result="failed",
                    ip=ip, ua=ua, reason="locked",
                )
                return Response(
                    {
                        "detail": f"Compte temporairement verrouillé. Réessayez dans {minutes_left} min.",
                        "reason": "account_locked",
                        "locked_until": candidate.locked_until.isoformat(),
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # 3. Email non vérifié — on bloque le login et on renvoie info OTP
            #    Sauf pour les comptes staff/super_admin qu'on laisse passer
            #    (ils sont créés via createsuperuser, sans OTP)
            if not candidate.is_email_verified and not candidate.is_staff:
                # On (ré)envoie automatiquement un OTP pour faciliter l'UX
                try:
                    issue_otp(
                        identifier=candidate.email,
                        purpose="email_verify",
                        channel="email",
                        user=candidate,
                        request_ip=ip,
                    )
                except Exception:  # noqa: BLE001
                    pass
                record_login(
                    user=candidate, identifier=identifier, result="failed",
                    ip=ip, ua=ua, reason="email_not_verified",
                )
                return Response(
                    {
                        "detail": "Votre email n'est pas encore vérifié. "
                                  "Un nouveau code de vérification vient d'être envoyé.",
                        "reason": "email_not_verified",
                        "identifier": candidate.email,
                        "redirect_to": f"/otp?identifier={candidate.email}&purpose=email_verify",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Authentification standard (vérifie le password)
        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            record_login(user=candidate, identifier=identifier, result="failed", ip=ip, ua=ua)
            raise

        record_login(user=candidate, identifier=identifier, result="success", ip=ip, ua=ua)
        return response


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OTPViewSet(ViewSet):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @action(detail=False, methods=["post"], url_path="request")
    def request_code(self, request):
        from django.utils import timezone
        s = OTPRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        otp = issue_otp(
            identifier=s.validated_data["identifier"],
            purpose=s.validated_data["purpose"],
            channel=s.validated_data["channel"],
            request_ip=request.META.get("REMOTE_ADDR"),
        )
        expires_in = max(0, int((otp.expires_at - timezone.now()).total_seconds()))
        return Response({
            "otp_id": str(otp.id),
            "expires_at": otp.expires_at,
            "expires_in_seconds": expires_in,  # commode pour le compte à rebours côté front
            "max_attempts": otp.max_attempts,
        })

    @action(detail=False, methods=["post"], url_path="verify")
    def verify_code(self, request):
        s = OTPVerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        otp = verify_otp(
            identifier=s.validated_data["identifier"],
            code=s.validated_data["code"],
            purpose=s.validated_data["purpose"],
        )
        # Effets selon purpose
        if otp.user:
            if otp.purpose == "email_verify":
                otp.user.is_email_verified = True
                otp.user.kyc_level = max(otp.user.kyc_level, 1)
                otp.user.save(update_fields=["is_email_verified", "kyc_level"])
            elif otp.purpose == "phone_verify":
                otp.user.is_phone_verified = True
                otp.user.kyc_level = max(otp.user.kyc_level, 2)
                otp.user.save(update_fields=["is_phone_verified", "kyc_level"])
        return Response({"verified": True})


class PasswordResetViewSet(ViewSet):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    @action(detail=False, methods=["post"], url_path="request")
    def request_reset(self, request):
        s = PasswordResetSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        identifier = s.validated_data["identifier"]
        user = User.objects.filter(email__iexact=identifier).first()
        if user:
            issue_otp(
                identifier=identifier, purpose="password_reset",
                channel="email", user=user,
                request_ip=request.META.get("REMOTE_ADDR"),
            )
        # Réponse toujours identique pour éviter l'énumération
        return Response({"sent": True})

    @action(detail=False, methods=["post"], url_path="confirm")
    def confirm_reset(self, request):
        s = PasswordResetConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        verify_otp(
            identifier=s.validated_data["identifier"],
            code=s.validated_data["code"],
            purpose="password_reset",
        )
        user = User.objects.filter(email__iexact=s.validated_data["identifier"]).first()
        if not user:
            raise BusinessRuleViolation("Utilisateur introuvable.")
        user.set_password(s.validated_data["new_password"])
        user.save()
        return Response({"reset": True})


class TwoFactorViewSet(ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="setup")
    def setup(self, request):
        secret, uri, backup_codes = enable_2fa(request.user)
        return Response({"secret": secret, "provisioning_uri": uri, "backup_codes": backup_codes})

    @action(detail=False, methods=["post"], url_path="confirm")
    def confirm(self, request):
        s = TOTPConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        confirm_2fa(request.user, s.validated_data["code"])
        return Response({"enabled": True})

    @action(detail=False, methods=["post"], url_path="disable")
    def disable(self, request):
        request.user.two_factor_enabled = False
        request.user.totp_secret = ""
        request.user.save(update_fields=["two_factor_enabled", "totp_secret"])
        return Response({"enabled": False})
