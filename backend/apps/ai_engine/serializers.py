from rest_framework import serializers
from .models import AICallLog, BATAnalysis, PromptTemplate


class BATAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = BATAnalysis
        fields = "__all__"


class AICallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICallLog
        fields = "__all__"


class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = "__all__"
