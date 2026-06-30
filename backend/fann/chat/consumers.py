import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from fann.users.models import User
from .models import ChatRoom, Message, MessageCollection
from django.db.models import Q


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close()
            return

        # Save message in database
        msg_obj = await self.create_message(user.id, self.room_id, message)

        # Broadcast message to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": user.email,
                "sender_id": user.id,
                "timestamp": msg_obj.timestamp.isoformat(),
            },
        )

    async def chat_message(self, event):
        # Send message to WebSocket client
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def create_message(self, user_id, room_id, message):
        user = User.objects.get(id=user_id)
        room = ChatRoom.objects.get(id=room_id)
        exists_obj = (
            MessageCollection.objects.filter(room=room)
            .filter(Q(sender=user) | Q(receiver=user))
            .exists()
        )
        if not exists_obj:
            user_ids = room.name.split("_")
            other_user_id = (
                int(user_ids[0]) if int(user_ids[1]) == user.id else int(user_ids[1])
            )
            receiver = User.objects.get(id=other_user_id)
            MessageCollection.objects.create(sender=user, room=room, receiver=receiver)
        return Message.objects.create(sender=user, room=room, content=message)
