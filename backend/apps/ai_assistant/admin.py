from django.contrib import admin
from .models import AssistantConversation, AssistantMessage

admin.site.register(AssistantConversation)
admin.site.register(AssistantMessage)
