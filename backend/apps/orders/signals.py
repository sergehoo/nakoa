"""Signaux : historique de statut, événements WS, notifications."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Order, OrderStatusHistory


@receiver(pre_save, sender=Order)
def track_status_change(sender, instance: Order, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        prev = sender.objects.only("status").get(pk=instance.pk)
        instance._previous_status = prev.status
    except sender.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=Order)
def log_status_history(sender, instance: Order, created: bool, **kwargs):
    prev = getattr(instance, "_previous_status", None)
    if created:
        OrderStatusHistory.objects.create(
            order=instance, from_status="", to_status=instance.status,
        )
    elif prev and prev != instance.status:
        OrderStatusHistory.objects.create(
            order=instance, from_status=prev, to_status=instance.status,
        )
        # WebSocket broadcast
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            layer = get_channel_layer()
            if layer:
                async_to_sync(layer.group_send)(
                    f"order.{instance.id}",
                    {"type": "order.update", "status": instance.status},
                )
        except Exception:  # noqa: BLE001
            pass
