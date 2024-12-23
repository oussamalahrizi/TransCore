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