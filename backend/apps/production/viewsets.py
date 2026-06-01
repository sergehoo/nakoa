from django_fsm import TransitionNotAllowed
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.exceptions import InvalidStateTransition

from .models import ProductionIncident, ProductionJob, ProductionPhoto, ProductionStep
from .serializers import (
    ProductionIncidentSerializer,
    ProductionJobSerializer,
    ProductionPhotoSerializer,
    ProductionStepSerializer,
)


class ProductionJobViewSet(viewsets.ModelViewSet):
    serializer_class = ProductionJobSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "printer", "priority"]
    search_fields = ["reference", "order__reference"]

    def get_queryset(self):
        user = self.request.user
        qs = ProductionJob.objects.select_related("order", "printer").prefetch_related("steps", "incidents", "photos")
        if user.is_staff:
            return qs
        if getattr(user, "is_printer", False) and hasattr(user, "printer_profile"):
            return qs.filter(printer=user.printer_profile)
        return qs.none()

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        return self._transition(self.get_object(), "start")

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        return self._transition(self.get_object(), "pause")

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        return self._transition(self.get_object(), "resume")

    @action(detail=True, methods=["post"])
    def finish(self, request, pk=None):
        return self._transition(self.get_object(), "finish")

    def _transition(self, job: ProductionJob, method: str):
        try:
            getattr(job, method)()
            job.save()
        except TransitionNotAllowed as exc:
            raise InvalidStateTransition() from exc
        return Response(ProductionJobSerializer(job).data)


class ProductionStepViewSet(viewsets.ModelViewSet):
    serializer_class = ProductionStepSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ProductionStep.objects.all()
        if getattr(user, "is_printer", False) and hasattr(user, "printer_profile"):
            return ProductionStep.objects.filter(job__printer=user.printer_profile)
        return ProductionStep.objects.none()

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        step = self.get_object()
        try:
            step.start()
            step.save()
        except TransitionNotAllowed as exc:
            raise InvalidStateTransition() from exc
        return Response(ProductionStepSerializer(step).data)

    @action(detail=True, methods=["post"])
    def finish(self, request, pk=None):
        step = self.get_object()
        try:
            step.finish()
            step.save()
        except TransitionNotAllowed as exc:
            raise InvalidStateTransition() from exc
        return Response(ProductionStepSerializer(step).data)


class ProductionIncidentViewSet(viewsets.ModelViewSet):
    serializer_class = ProductionIncidentSerializer
    queryset = ProductionIncident.objects.all()
    permission_classes = [IsAuthenticated]


class ProductionPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = ProductionPhotoSerializer
    queryset = ProductionPhoto.objects.all()
    permission_classes = [IsAuthenticated]
