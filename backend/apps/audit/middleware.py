"""Middleware d'audit — capture les actions sensibles via les vues DRF."""

from django.utils.deprecation import MiddlewareMixin


SENSITIVE_PATHS = (
    "/api/v1/orders/", "/api/v1/payments/", "/api/v1/kyc/",
    "/api/v1/accounts/me/", "/api/v1/auth/",
)


class AuditTrailMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if not getattr(request, "user", None) or not request.user.is_authenticated:
            return response
        if request.method == "GET":
            return response
        if not request.path.startswith(SENSITIVE_PATHS):
            return response
        try:
            from .models import AuditLog
            AuditLog.objects.create(
                actor=request.user,
                action=f"{request.method} {request.path}",
                resource_type="http_request",
                resource_id=request.path,
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
                request_id=getattr(request, "request_id", ""),
                metadata={"status_code": response.status_code},
            )
        except Exception:  # noqa: BLE001
            pass
        return response
