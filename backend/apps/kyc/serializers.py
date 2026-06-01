from rest_framework import serializers
from .models import KYCDocument, KYCSubmission


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = "__all__"


class KYCSubmissionSerializer(serializers.ModelSerializer):
    documents = KYCDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = KYCSubmission
        fields = "__all__"
        read_only_fields = ["id", "user", "reviewer", "decided_at", "created_at"]
