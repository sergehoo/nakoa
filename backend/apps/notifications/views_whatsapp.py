"""Endpoints WhatsApp Cloud API — webhook + verify."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .services_whatsapp import handle_inbound_message, verify_webhook_token


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def whatsapp_webhook(request):
    """Endpoint unique pour le handshake (GET) et les messages (POST)."""
    if request.method == "GET":
        mode = request.query_params.get("hub.mode", "")
        token = request.query_params.get("hub.verify_token", "")
        challenge = request.query_params.get("hub.challenge", "")
        result = verify_webhook_token(mode, token, challenge)
        if result:
            return Response(int(result))
        return Response({"error": "verify_failed"}, status=403)

    # POST : message entrant
    handle_inbound_message(request.data)
    return Response({"status": "received"}, status=200)
