from rest_framework import serializers

from .models import ProductionIncident, ProductionJob, ProductionPhoto, ProductionStep


class ProductionStepSerializer(serializers.ModelSerializer):
    operator_email = serializers.EmailField(source="operator.email", read_only=True)

    class Meta:
        model = ProductionStep
        fields = [
            "id", "kind", "name", "position", "operator", "operator_email",
            "machine", "estimated_duration", "actual_duration",
            "started_at", "completed_at", "status", "comment",
        ]


class ProductionPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionPhoto
        fields = ["id", "image", "caption", "step", "created_at"]


class ProductionIncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionIncident
        fields = [
            "id", "cause", "severity", "description", "photos", "step",
            "resolved_at", "resolution_note", "created_at",
        ]


class ProductionJobSerializer(serializers.ModelSerializer):
    steps = ProductionStepSerializer(many=True, read_only=True)
    incidents = ProductionIncidentSerializer(many=True, read_only=True)
    photos = ProductionPhotoSerializer(many=True, read_only=True)
    order_reference = serializers.CharField(source="order.reference", read_only=True)

    class Meta:
        model = ProductionJob
        fields = [
            "id", "reference", "order", "order_reference", "printer",
            "assigned_machine", "assigned_lead", "priority", "status",
            "estimated_duration", "actual_duration",
            "queued_at", "started_at", "completed_at",
            "qr_code", "notes", "steps", "incidents", "photos", "created_at",
        ]
