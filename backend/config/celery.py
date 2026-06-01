"""Configuration Celery."""

import os

from celery import Celery
from celery.signals import setup_logging

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("printhub")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@setup_logging.connect
def configure_celery_logging(**_kwargs):
    """Laisse Django gérer le logging (LOGGING settings)."""
    from logging.config import dictConfig

    from django.conf import settings

    if hasattr(settings, "LOGGING"):
        dictConfig(settings.LOGGING)


@app.task(bind=True)
def debug_task(self):
    print(f"Celery debug — request: {self.request!r}")
