# fann/notifications/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        self.group_name = None
        if user.is_anonymous:
            await self.close()
        else:
            import re

            clean_id = re.sub(r"[^a-zA-Z0-9_.-]", "", str(user.id))
            self.group_name = f"user_{clean_id}"  # ✅ define it here
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name") and self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["message"]))
