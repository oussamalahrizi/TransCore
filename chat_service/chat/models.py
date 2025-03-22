# chat/models.py
from django.db import models

class Message(models.Model):
    sender = models.CharField(max_length=255, null=False, blank=False)
    recipient = models.CharField(max_length=255, null=False, blank=False)
    content = models.TextField()
    room = models.CharField(max_length=255, default="default_room")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} -> {recipient}: {content}"