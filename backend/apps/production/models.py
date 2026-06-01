"""ERP production : jobs, étapes, opérateurs, incidents."""

from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_fsm import FSMField, transition

from apps.core.models import BaseModel
from apps.core.utils import generate_reference


class JobStatus(models.TextChoices):
    QUEUED = "queued", _("En file d'attente")
    IN_PROGRESS = "in_progress", _("En cours")
    ON_HOLD = "on_hold", _("En pause")
    BLOCKED = "blocked", _("Bloqué (incident)")
    DONE = "done", _("Terminé")
    CANCELLED = "cancelled", _("Annulé")


class ProductionJob(BaseModel):
    reference = models.CharField(max_length=32, unique=True)
    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="production_job")
    printer = models.ForeignKey("printers.PrinterProfile", on_delete=models.PROTECT, related_name="jobs")
    assigned_machine = models.ForeignKey(
        "printers.Machine", null=True, blank=True, on_delete=models.SET_NULL, related_name="jobs",
    )
    assigned_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="led_jobs",
    )

    estimated_duration = models.DurationField(default=timedelta(hours=4))
    actual_duration = models.DurationField(null=True, blank=True)
    queued_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    qr_code = models.CharField(max_length=64, blank=True, db_index=True)
    status = FSMField(default=JobStatus.QUEUED, choices=JobStatus.choices, db_index=True)
    priority = models.PositiveSmallIntegerField(default=5, help_text="1 = max, 9 = min")
    notes = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["printer", "status", "priority"]),
            models.Index(fields=["status", "started_at"]),
        ]
        ordering = ["priority", "queued_at"]

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = generate_reference("JOB")
        super().save(*args, **kwargs)

    @transition(field=status, source=[JobStatus.QUEUED], target=JobStatus.IN_PROGRESS)
    def start(self):
        from django.utils import timezone
        self.started_at = timezone.now()

    @transition(field=status, source=[JobStatus.IN_PROGRESS], target=JobStatus.ON_HOLD)
    def pause(self):
        pass

    @transition(field=status, source=[JobStatus.ON_HOLD, JobStatus.BLOCKED], target=JobStatus.IN_PROGRESS)
    def resume(self):
        pass

    @transition(field=status, source=[JobStatus.IN_PROGRESS], target=JobStatus.BLOCKED)
    def block(self):
        pass

    @transition(field=status, source=[JobStatus.IN_PROGRESS, JobStatus.QUEUED], target=JobStatus.DONE)
    def finish(self):
        from django.utils import timezone
        self.completed_at = timezone.now()
        if self.started_at:
            self.actual_duration = self.completed_at - self.started_at


class ProductionStep(BaseModel):
    class Kind(models.TextChoices):
        PREPRESS = "prepress", _("Prépresse")
        CALIBRATION = "calibration", _("Calage")
        PRINTING = "printing", _("Impression")
        FINISHING = "finishing", _("Finition")
        QUALITY_CHECK = "quality_check", _("Contrôle qualité")
        PACKAGING = "packaging", _("Emballage")
        OTHER = "other", _("Autre")

    job = models.ForeignKey(ProductionJob, on_delete=models.CASCADE, related_name="steps")
    kind = models.CharField(max_length=24, choices=Kind.choices)
    name = models.CharField(max_length=120)
    position = models.PositiveIntegerField(default=0)
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="production_steps",
    )
    machine = models.ForeignKey("printers.Machine", null=True, blank=True, on_delete=models.SET_NULL)

    estimated_duration = models.DurationField(default=timedelta(hours=1))
    actual_duration = models.DurationField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = FSMField(default=JobStatus.QUEUED, choices=JobStatus.choices)
    comment = models.TextField(blank=True)

    class Meta:
        ordering = ["job", "position"]

    @transition(field=status, source=[JobStatus.QUEUED, JobStatus.ON_HOLD], target=JobStatus.IN_PROGRESS)
    def start(self):
        from django.utils import timezone
        self.started_at = timezone.now()

    @transition(field=status, source=[JobStatus.IN_PROGRESS], target=JobStatus.DONE)
    def finish(self):
        from django.utils import timezone
        self.completed_at = timezone.now()
        if self.started_at:
            self.actual_duration = self.completed_at - self.started_at


class ProductionIncident(BaseModel):
    class Cause(models.TextChoices):
        PAPER = "paper", _("Papier")
        MACHINE = "machine", _("Machine")
        BAT = "bat", _("BAT")
        OPERATOR = "operator", _("Opérateur")
        ELECTRICAL = "electrical", _("Coupure électrique")
        OTHER = "other", _("Autre")

    class Severity(models.TextChoices):
        LOW = "low", _("Faible")
        MEDIUM = "medium", _("Moyenne")
        HIGH = "high", _("Élevée")
        CRITICAL = "critical", _("Critique")

    job = models.ForeignKey(ProductionJob, on_delete=models.CASCADE, related_name="incidents")
    step = models.ForeignKey(
        ProductionStep, null=True, blank=True, on_delete=models.SET_NULL, related_name="incidents",
    )
    cause = models.CharField(max_length=16, choices=Cause.choices)
    severity = models.CharField(max_length=16, choices=Severity.choices, default=Severity.MEDIUM)
    description = models.TextField()
    photos = models.JSONField(default=list, blank=True)
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="reported_incidents",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)


class ProductionPhoto(BaseModel):
    job = models.ForeignKey(ProductionJob, on_delete=models.CASCADE, related_name="photos")
    step = models.ForeignKey(
        ProductionStep, null=True, blank=True, on_delete=models.SET_NULL, related_name="photos",
    )
    image = models.ImageField(upload_to="production/photos/")
    caption = models.CharField(max_length=255, blank=True)
    taken_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="production_photos",
    )
