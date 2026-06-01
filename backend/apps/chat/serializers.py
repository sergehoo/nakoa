from rest_framework import serializers
from .models import Conversation, ConversationMember, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source="sender.email", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "sender_email", "body", "attachments", "is_system", "edited_at", "created_at"]
        read_only_fields = ["id", "sender", "sender_email", "edited_at", "created_at"]


class ConversationMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationMember
        fields = ["user", "role", "last_read_at", "is_muted"]


class ConversationSerializer(serializers.ModelSerializer):
    members = ConversationMemberSerializer(source="conversationmember_set", many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "kind", "subject", "order", "quote_request", "members", "last_message_at", "last_message", "is_archived", "created_at"]
        read_only_fields = ["id", "last_message_at", "created_at"]

    def get_last_message(self, obj):
        m = obj.messages.last()
        if not m:
            return None
        return {"id": str(m.id), "body": m.body[:140], "sender": m.sender_id, "created_at": m.created_at}
