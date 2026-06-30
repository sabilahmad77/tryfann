from rest_framework import generics, permissions
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from fann.common.response_mixins import BaseAPIView
from .models import ChatRoom, Message, MessageCollection
from .serializers import ChatRoomSerializer, MessageSerializer, MessageListSerializer
from django.db.models import Q
from fann.users.models import User


class ChatRoomListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # return chat rooms where the user is a participant
        return ChatRoom.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        # when creating a room, add the request user as participant
        room = serializer.save()
        room.participants.add(self.request.user)


class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageListSerializer

    def get_queryset(self):
        room_id = self.kwargs.get("room_id")
        return Message.objects.filter(room_id=room_id).order_by("timestamp")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

        # if not message or not message.room or not message.sender:
        #     return
        #
        # room = message.room
        # sender = message.sender
        # participants = getattr(room, "participants", None)
        # if participants:
        #     other_participants = participants.exclude(id=sender.id)
        #     for receiver in other_participants:
        #         MessageCollection.objects.get_or_create(
        #             room=room,
        #             sender=sender,
        #             receiver=receiver
        #         )


class ChatRoomMessagesView(ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_id = self.kwargs["room_id"]
        return Message.objects.filter(room_id=room_id).order_by(
            "-timestamp"
        )  # newest first


class MessageCollectionView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            user = request.user
            collections = MessageCollection.objects.filter(
                Q(receiver=user) | Q(sender=user)
            ).select_related("sender", "room")

            result = []
            for c in collections:
                sender = c.sender
                message_count = Message.objects.filter(room=c.room).count()

                try:
                    user_ids = list(map(int, c.room.name.split("_")))
                except:
                    user_ids = []

                receiver_id = None
                if user_ids:
                    if user.id == user_ids[0]:
                        receiver_id = user_ids[1]
                    else:
                        receiver_id = user_ids[0]

                receiver_user = None
                if receiver_id:
                    from django.contrib.auth import get_user_model

                    User = get_user_model()
                    try:
                        receiver_user = User.objects.get(id=receiver_id)
                    except User.DoesNotExist:
                        receiver_user = None

                result.append(
                    {
                        "room_id": c.room.id,
                        "room_name": c.room.name,
                        "sender_id": sender.id,
                        "sender_name": f"{sender.first_name} {sender.last_name}",
                        "receiver_id": receiver_user.id if receiver_user else None,
                        "receiver_name": (
                            f"{receiver_user.first_name} {receiver_user.last_name}"
                            if receiver_user
                            else None
                        ),
                        "message_count": message_count,
                    }
                )

            return self.send_success_response(data=result)
        except Exception as e:
            return self.send_bad_request_response(message=str(e))


class ContactSellerChatView(BaseAPIView, ListAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            user = request.user
            seller_id = request.data.get("seller_id")
            if not seller_id:
                return self.send_bad_request_response(message="seller_id is required")
            try:
                seller = User.objects.get(id=seller_id)
            except User.DoesNotExist:
                return self.send_bad_request_response(message="Seller not found")

            room = ChatRoom.objects.filter(
                Q(name=f"{user.id}_{seller.id}") | Q(name=f"{seller.id}_{user.id}")
            ).first()

            if not room:
                room_name = f"{user.id}_{seller.id}"
                room = ChatRoom.objects.create(name=room_name)

            messages = Message.objects.filter(room=room).order_by("timestamp")
            serializer = MessageListSerializer(
                messages, many=True, context={"request": request}
            )

            return self.send_success_response(
                data={"room_id": room.id, "messages": serializer.data}
            )

        except Exception as e:
            return self.send_bad_request_response(message=str(e))
