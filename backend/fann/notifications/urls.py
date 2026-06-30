from django.urls import path
from .views import (
    UserNotificationListView,
    MarkNotificationReadView,
    UnreadNotificationCountView,
)

urlpatterns = [
    path("", UserNotificationListView.as_view(), name="notification-list"),
    path(
        "<int:id>/read/",
        MarkNotificationReadView.as_view(),
        name="notification-mark-read",
    ),
    path("unread-count/", UnreadNotificationCountView.as_view(), name="unread-count"),
]
