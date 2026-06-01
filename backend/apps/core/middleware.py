"""Middleware utilitaires."""

import uuid

from django.utils.deprecation import MiddlewareMixin


class RequestIDMiddleware(MiddlewareMixin):
    """Génère un identifiant unique par requête pour la corrélation des logs."""

    HEADER = "HTTP_X_REQUEST_ID"
    RESPONSE_HEADER = "X-Request-ID"

    def process_request(self, request):
        request.request_id = request.META.get(self.HEADER) or uuid.uuid4().hex

    def process_response(self, request, response):
        if hasattr(request, "request_id"):
            response[self.RESPONSE_HEADER] = request.request_id
        return response
