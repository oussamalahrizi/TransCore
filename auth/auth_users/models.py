from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser

class Player(AbstractUser):
     auth_provider = models.CharField(max_length=50, choices=[('email', 'Email'), ('google', 'Google')], default='email')
     username = 
     


# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # Add your custom fields here
    auth_provider = models.CharField(max_length=50, choices=[('email', 'Email'), ('google', 'Google')], default='email')
    rank = models.IntegerField(default=1)
    level = models.IntegerField(default=1)
    is_banned = models.BooleanField(default=False)
    icon_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.username
