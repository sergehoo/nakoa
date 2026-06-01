from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer


class AnalyticsEventViewSet(viewsets.ModelViewSet):
    serializer_class = AnalyticsEventSerializer
    permission_classes = [IsAuthenticated]
    queryset = AnalyticsEvent.objects.all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user if self.request.user.is_authenticated else None)
