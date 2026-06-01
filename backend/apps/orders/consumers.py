"""WebSocket consumer pour suivi commande en temps réel."""

from channels.generic.websocket import AsyncJsonWebsocketConsumer


class OrderConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.order_id = self.scope["url_route"]["kwargs"]["order_id"]
        self.group_name = f"order.{self.order_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def order_update(self, event):
        await self.send_json({"type": "order.update", "status": event.get("status")})
