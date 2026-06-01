from rest_framework import serializers
from .models import CRMActivity, Lead


class CRMActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CRMActivity
        fields = "__all__"


class LeadSerializer(serializers.ModelSerializer):
    activities = CRMActivitySerializer(many=True, read_only=True)

    class Meta:
        model = Lead
        fields = "__all__"
