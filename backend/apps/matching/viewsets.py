from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from .models import MatchingRun
from .serializers import MatchingRunSerializer


class MatchingRunViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MatchingRunSerializer
    queryset = MatchingRun.objects.all()
    permission_classes = [IsAdminUser]
