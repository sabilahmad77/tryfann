from rest_framework import serializers
from .models import ChatRoom, Message
from fann.users.serializers import (
    UserDetailSerializer,
)  # reuse your user serializer if you want


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "room", "sender", "content", "timestamp", "read"]
        read_only_fields = ["id", "timestamp", "sender", "read"]


class ChatRoomSerializer(serializers.ModelSerializer):
    participants = serializers.StringRelatedField(many=True)

    class Meta:
        model = ChatRoom
        fields = ["id", "participants", "created_at"]


class MessageListSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField(read_only=True)
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "room", "sender", "content", "timestamp", "sender_id"]
