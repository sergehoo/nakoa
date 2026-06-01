from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Conversation, ConversationMember, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        conv = self.get_object()
        if request.method == "POST":
            body = request.data.get("body", "").strip()
            if not body:
                return Response({"detail": "body required"}, status=400)
            msg = Message.objects.create(conversation=conv, sender=request.user, body=body)
            conv.last_message_at = timezone.now()
            conv.save(update_fields=["last_message_at"])
            # Broadcast WS
            try:
                from asgiref.sync import async_to_sync
                from channels.layers import get_channel_layer
                layer = get_channel_layer()
                if layer:
                    async_to_sync(layer.group_send)(
                        f"chat.{conv.id}",
                        {"type": "chat.message", "message": MessageSerializer(msg).data},
                    )
            except Exception:  # noqa: BLE001
                pass
            return Response(MessageSerializer(msg).data, status=201)
        qs = conv.messages.all()
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(MessageSerializer(page, many=True).data)
        return Response(MessageSerializer(qs, many=True).data)
