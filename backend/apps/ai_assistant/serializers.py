from rest_framework import serializers
from .models import AssistantConversation, AssistantMessage


class AssistantMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssistantMessage
        fields = ["id", "role", "content", "tool_calls", "tokens", "created_at"]


class AssistantConversationSerializer(serializers.ModelSerializer):
    messages = AssistantMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AssistantConversation
        fields = ["id", "persona", "title", "context", "is_archived", "messages", "created_at"]
        read_only_fields = ["id", "created_at"]
