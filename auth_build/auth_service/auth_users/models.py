from django.db import models

# Create your models here.

import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class AuthProvider(models.Model):
    name = models.CharField(
         max_length=50,
         choices=[('Email', 'email'), ('Google', 'google'), ('Intra', 'intra')],
         default='Email', unique=True)


    def __str__(self):
        return str(self.name)

class UserManager(BaseUserManager):
    
    def create_user(
        self, email,
          username,
          password=None,
          auth_provider="Email",
          **extra_fields
    ):
        if not email:
            raise ValueError("email required")
        if not username:
            raise ValueError("username required")
        if auth_provider == "email" and not password:
            raise ValueError("password required if auth_provider is email")
        auth_obj, created = AuthProvider.objects.get_or_create(name=auth_provider)
        if auth_provider == "email" and len(password) < 8:
            raise ValueError("password too short")
        user = self.model(email=email,
            username=username,
            password=password,
            **extra_fields)
        if auth_provider == "Email":
            user.set_password(password)
        user.save()
        user.auth_provider.add(auth_obj)
        return user
    
    def create_superuser(self, email,
          username,
          password=None,
          auth_provider="Email",
          **extra_fields):
          extra_fields.setdefault("is_superuser", True)
          return self.create_user(email, username, password, auth_provider, **extra_fields)



class User(AbstractBaseUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(max_length=255, unique=True)
    
    auth_provider = models.ManyToManyField(AuthProvider, related_name="users")
    icon_url = models.URLField(blank=True, null=True)
    password = models.CharField(max_length=128, blank=True, null=True)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.TextField(null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects :UserManager = UserManager()

    def __str__(self):
        return self.username
    
from django.conf import settings
import os

class ImageUser(models.Model):
    image = models.ImageField(upload_to=settings.MEDIA_ROOT, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user")


class FriendsManager(models.Manager):
    """
        TODO:
            - get friendship status:
                - if pending get who requested the friendship
                    example : api view to get list of pending requests the user sent
                - get the friendship requests the user received
                - get the list of friends excluding the users blocked by the self and the users who blocked him
                - when viewing someones profile :
                    - if the user blocked the requested profile, there should be a way to unblock him
                    - if the user is blocked by that profile just return 403

   """
    
    def add_friend(self, from_user: User, to_user: User):
        if from_user == to_user:
            raise ValueError("you cannot make friends with yourself </3")
        status, action_by = self.are_friends(from_user, to_user)
        if status == "accepted":
            raise ValueError("You are already friends")
        if status == "pending":
            message = None
            if action_by == from_user:
                message = f"You already sent a friend request to {to_user.username}"
            else:
                message = f'{to_user.username} already sent you a friend request'
            raise ValueError(message)
        if status == "blocked":
            message = None
            if action_by == from_user:
                message = "You can't send a friend request to someone you blocked"
            else:
                message = f"{to_user.username} has blocked you, therefore you cant send a friend request"
            raise ValueError(message)
        if status is None:
            friend = self.model(from_user=from_user, to_user=to_user, status="pending")
            friend.save()
    
    def are_friends(self, from_user, to_user):
        try:
            relation = self.filter(from_user=from_user, to_user=to_user).get()
            return relation.status, from_user
        except Friends.DoesNotExist:
            try:
                relation = self.filter(from_user=to_user, to_user=from_user).get()
                return relation.status, to_user
            except Friends.DoesNotExist:
                return None, None

    def get_sent_reqs(self, from_user):
        """
        Retrieve a list of 'to_user' values for pending requests sent by a specific user.

        Args:
            from_user (User): The user who sent the requests.

        Returns:
            QuerySet: A QuerySet containing the 'to_user' values for pending requests.
        """
        return self.filter(from_user=from_user, status="pending") \
            .all() \
            .values_list('to_user', flat=True)
     
    def get_received_reqs(self, from_user):
        return self.filter(to_user=from_user, status="pending") \
               .all() \
               .values_list('from_user', flat=True)

    def get_friends(self, user):
        friends_from_user = self.filter(from_user=user, status='accepted') \
            .all() \
            .values_list('to_user', flat=True)
        friends_to_user = self.filter(to_user=user, status='accepted') \
            .all() \
            .values_list('from_user', flat=True)
        friends = list(friends_from_user.union(friends_to_user))
        return friends
    
    def get_blocked_users(self, user: User):
        # Get users that the user has directly blocked (as from_user)
        blocked_as_from = self.filter(from_user=user, status='blocked').values_list('to_user', flat=True)
        return blocked_as_from
    
class Friends(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="from_user")
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="to_user")
    status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'),
                ('accepted', 'Accepted'),
                ('blocked', 'Blocked')],
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects : FriendsManager = FriendsManager()

    class Meta:
        unique_together = ('from_user', 'to_user')
