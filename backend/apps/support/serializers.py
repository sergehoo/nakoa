from rest_framework import serializers
from .models import Ticket, TicketMessage


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source="sender.email", read_only=True)

    class Meta:
        model = TicketMessage
        fields = ["id", "ticket", "sender", "sender_email", "body", "attachments", "is_internal", "created_at"]
        read_only_fields = ["id", "sender", "sender_email", "created_at"]


class TicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "reference", "requester", "assignee", "order",
            "subject", "category", "priority", "status",
            "sla_due_at", "resolved_at", "messages", "created_at",
        ]
        read_only_fields = ["id", "reference", "requester", "resolved_at", "created_at"]
