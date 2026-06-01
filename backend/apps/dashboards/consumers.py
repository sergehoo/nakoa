from channels.generic.websocket import AsyncJsonWebsocketConsumer


class DashboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.scope_param = self.scope["url_route"]["kwargs"]["scope"]
        self.group_name = f"dashboard.{self.scope_param}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def dashboard_update(self, event):
        await self.send_json(event)
