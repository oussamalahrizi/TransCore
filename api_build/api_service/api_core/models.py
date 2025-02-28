from django.db import models
import uuid

# Create your models here.

class NotificationManager(models.Manager):
    
    def create_notification(self, user_id : str, message : str):
        notif = self.model(
            user = user_id,
            message = message)
        notif.save()
        return notif
    
class Notification(models.Model):

    id = models.UUIDField(editable=False, primary_key=True, default=uuid.uuid4)
    message = models.CharField(null=False, blank=False)
    status = models.CharField(
        max_length=10,
        choices=[('read', 'Read'),
                ('delivered', 'Delivered')],
        default="delivered"
    )
    user = models.UUIDField(editable=False, null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects : NotificationManager = NotificationManager()

    def __str__(self):
        return self.message
