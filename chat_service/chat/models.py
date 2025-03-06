from django.db import models
from django.contrib.auth import get_user_model
from datetime import datetime
from django.utils import timezone

User = get_user_model()

from django.db import models
from django.contrib.auth.models import User
import uuid

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

class Message(models.Model):
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE, null=True)
    recipient = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE, null=True)
    content = models.TextField()
    room = models.CharField(max_length=255, default="default_room")  
    timestamp = models.DateTimeField(default=datetime.now, blank=True)

    def __str__(self):
        return f"{self.sender} -> {self.recipient}: {self.content}"
        
from django.db import models
from django.contrib.auth import get_user_model


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['user', 'read'])]



