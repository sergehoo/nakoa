from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["printer", "overall_rating", "status"]
    ordering_fields = ["created_at", "overall_rating"]

    def get_queryset(self):
        qs = Review.objects.filter(status="published").select_related("printer")
        printer_id = self.request.query_params.get("printer")
        if printer_id:
            return qs.filter(printer_id=printer_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        review = self.get_object()
        # Vérification que c'est bien l'imprimeur concerné
        if not hasattr(request.user, "printer_profile") or review.printer != request.user.printer_profile:
            return Response({"detail": "forbidden"}, status=403)
        review.printer_response = request.data.get("body", "")
        review.printer_response_at = timezone.now()
        review.save(update_fields=["printer_response", "printer_response_at"])
        return Response(ReviewSerializer(review).data)
