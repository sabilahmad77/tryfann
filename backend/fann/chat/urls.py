from django.urls import path
from .views import (
    ChatRoomListCreateView,
    MessageListCreateView,
    MessageCollectionView,
    ContactSellerChatView,
)

urlpatterns = [
    path("rooms/", ChatRoomListCreateView.as_view(), name="chat-room-list-create"),
    path(
        "rooms/<int:room_id>/messages/",
        MessageListCreateView.as_view(),
        name="message-list-create",
    ),
    path(
        "message_collection/",
        MessageCollectionView.as_view(),
        name="message_collection",
    ),
    path(
        "contact_seller_chat/",
        ContactSellerChatView.as_view(),
        name="contact_seller_chat",
    ),
]
