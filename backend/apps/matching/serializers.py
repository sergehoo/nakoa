from rest_framework import serializers

from .models import MatchingRun


class MatchingRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingRun
        fields = "__all__"
