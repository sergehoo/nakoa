from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ProductionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.job_id = self.scope["url_route"]["kwargs"]["job_id"]
        self.group_name = f"production.{self.job_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def production_update(self, event):
        await self.send_json(event)
