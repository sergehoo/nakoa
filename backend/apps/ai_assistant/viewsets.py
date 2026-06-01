from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AssistantConversation
from .serializers import AssistantConversationSerializer, AssistantMessageSerializer
from .services import reply_in_conversation


class AssistantConversationViewSet(viewsets.ModelViewSet):
    serializer_class = AssistantConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AssistantConversation.objects.filter(user=self.request.user).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        conv = self.get_object()
        text = (request.data.get("content") or "").strip()
        if not text:
            return Response({"detail": "content requis"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            msg = reply_in_conversation(conversation=conv, user_text=text, user=request.user)
        except Exception as exc:  # noqa: BLE001
            return Response({"detail": str(exc)[:255]}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(AssistantMessageSerializer(msg).data, status=201)
