"""Routing WebSocket global."""

from django.urls import path

from apps.chat.consumers import ChatConsumer
from apps.notifications.consumers import NotificationsConsumer
from apps.orders.consumers import OrderConsumer
from apps.production.consumers import ProductionConsumer
from apps.dashboards.consumers import DashboardConsumer

websocket_urlpatterns = [
    path("ws/chat/<uuid:conversation_id>/", ChatConsumer.as_asgi()),
    path("ws/notifications/", NotificationsConsumer.as_asgi()),
    path("ws/orders/<uuid:order_id>/", OrderConsumer.as_asgi()),
    path("ws/production/<uuid:job_id>/", ProductionConsumer.as_asgi()),
    path("ws/dashboards/<str:scope>/", DashboardConsumer.as_asgi()),
]
