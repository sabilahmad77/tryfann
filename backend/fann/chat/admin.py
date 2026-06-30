from django.contrib import admin

from fann.chat.models import ChatRoom, MessageCollection, Message

# Register your models here.
admin.site.register(ChatRoom)
admin.site.register(MessageCollection)
admin.site.register(Message)
