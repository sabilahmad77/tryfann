from django.db import models
from fann.users.models import User


class ChatRoom(models.Model):
    # Define the room - e.g. a buyer-seller pair identifier or group name
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    room = models.ForeignKey(
        ChatRoom, related_name="messages", on_delete=models.CASCADE
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]


class MessageCollection(models.Model):
    room = models.ForeignKey(
        ChatRoom,
        related_name="messages_collection",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    sender = models.ForeignKey(
        User,
        related_name="sent_collections",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    receiver = models.ForeignKey(
        User,
        related_name="received_collections",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
