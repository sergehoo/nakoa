"""Exceptions et handler d'erreurs API uniformisés (RFC 7807)."""

from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler


class PrintHubException(APIException):
    """Base — toutes les exceptions métier en héritent."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Une erreur métier est survenue."
    default_code = "printhub_error"


class BusinessRuleViolation(PrintHubException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_code = "business_rule_violation"


class InvalidStateTransition(BusinessRuleViolation):
    default_detail = "Transition d'état invalide pour cette ressource."
    default_code = "invalid_state_transition"


class PaymentFailed(PrintHubException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "Le paiement a échoué."
    default_code = "payment_failed"


class KYCRequired(PrintHubException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "Vérification KYC requise pour cette opération."
    default_code = "kyc_required"


class RateLimited(PrintHubException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_detail = "Trop de requêtes — réessayez plus tard."
    default_code = "rate_limited"


def printhub_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """Format RFC 7807 (problem+json) avec request_id si disponible."""

    response = exception_handler(exc, context)
    if response is None:
        return None

    request = context.get("request")
    body: dict[str, Any] = {
        "type": "about:blank",
        "title": getattr(exc, "default_detail", "Erreur"),
        "status": response.status_code,
        "code": getattr(exc, "default_code", "error"),
        "detail": response.data,
    }
    if request and hasattr(request, "request_id"):
        body["request_id"] = request.request_id

    response.data = body
    return response
