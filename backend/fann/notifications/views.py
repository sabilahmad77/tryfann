from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class UserNotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by(
            "-created_at"
        )


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Notification.objects.all()
    lookup_field = "id"

    def update(self, request, *args, **kwargs):
        notification = self.get_object()

        if notification.recipient != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        notification.is_read = True
        notification.save()
        return Response({"message": "Marked as read"})


class UnreadNotificationCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"unread_count": count})
