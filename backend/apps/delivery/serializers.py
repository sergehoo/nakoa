from rest_framework import serializers
from .models import DeliveryAssignment, DeliveryProof, GPSPoint


class DeliveryAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryAssignment
        fields = "__all__"


class GPSPointSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()

    class Meta:
        model = GPSPoint
        fields = ["id", "assignment", "lat", "lng", "speed_kmh", "heading", "accuracy_m", "recorded_at"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_lng(self, obj):
        return obj.location.x if obj.location else None


class DeliveryProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProof
        exclude = ["location"]
