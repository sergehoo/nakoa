from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import KYCDocument, KYCSubmission, KYCSubmissionStatus
from .serializers import KYCDocumentSerializer, KYCSubmissionSerializer


class KYCSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = KYCSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return KYCSubmission.objects.all().prefetch_related("documents")
        return KYCSubmission.objects.filter(user=self.request.user).prefetch_related("documents")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        sub = self.get_object()
        sub.status = KYCSubmissionStatus.SUBMITTED
        sub.submitted_at = timezone.now()
        sub.save(update_fields=["status", "submitted_at"])
        return Response({"submitted": True})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        sub = self.get_object()
        sub.status = KYCSubmissionStatus.APPROVED
        sub.reviewer = request.user
        sub.decided_at = timezone.now()
        sub.decision_note = request.data.get("note", "")
        sub.save()
        if sub.type == "customer":
            sub.user.kyc_level = max(sub.user.kyc_level, 3)
            sub.user.save(update_fields=["kyc_level"])
        elif sub.type == "business" and hasattr(sub.user, "printer_profile"):
            sub.user.printer_profile.kyc_status = "approved"
            sub.user.printer_profile.status = "active"
            sub.user.printer_profile.save(update_fields=["kyc_status", "status"])
        return Response({"approved": True})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        sub = self.get_object()
        sub.status = KYCSubmissionStatus.REJECTED
        sub.reviewer = request.user
        sub.decided_at = timezone.now()
        sub.decision_note = request.data.get("note", "")
        sub.save()
        # Si KYB : marque le profil imprimeur comme rejected
        if sub.type == "business" and hasattr(sub.user, "printer_profile"):
            sub.user.printer_profile.kyc_status = "rejected"
            sub.user.printer_profile.save(update_fields=["kyc_status"])
        return Response({"rejected": True})

    @action(detail=True, methods=["post"], url_path="needs-info", permission_classes=[IsAdminUser])
    def needs_info(self, request, pk=None):
        """Demande à l'utilisateur de compléter son dossier (sans rejeter)."""
        note = request.data.get("note", "").strip()
        if not note:
            return Response(
                {"detail": "Précisez ce qui manque dans la note."},
                status=400,
            )
        sub = self.get_object()
        sub.status = KYCSubmissionStatus.NEEDS_INFO
        sub.reviewer = request.user
        sub.decided_at = timezone.now()
        sub.decision_note = note
        sub.save()
        return Response({"needs_info": True, "note": note})


class KYCDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KYCDocumentSerializer
    permission_classes = [IsAuthenticated]
    queryset = KYCDocument.objects.all()

    def get_queryset(self):
        # Sécurité : un user ne voit que ses propres docs (sauf staff)
        if self.request.user.is_staff:
            return KYCDocument.objects.all()
        return KYCDocument.objects.filter(submission__user=self.request.user)
