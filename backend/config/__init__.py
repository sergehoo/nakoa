"""Configuration globale du projet PrintHub."""

from .celery import app as celery_app

__all__ = ("celery_app",)
