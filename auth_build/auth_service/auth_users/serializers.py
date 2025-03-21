from django.contrib.auth.hashers import check_password
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.http import Http404
from .models import AuthProvider, User

"""
	use different serializer as you can depending on the task
"""

"""
	when writing serializers using modelserializer you should follow these rules:
	- use meta class to include fields from ur model
	- required fields are the required fields by the model imported
	- if you want to override you should add extra_kwargs like this :
		# (question: what other fields can you make? a : inspect serializer class --classic django)
		# extra kwargs available values : look valid_kwargs in model serializer class
		model = test
		fields = ['one', 'two'] #one is required two isnt
		extra_kwargs = {
		'one' : {'required' : False},
		'two' : {'required' : True}
		}
		code above make one not required even tho its required by the model and it will raise an exception when creating an instance on it
		two now required even tho in the model it isnt
	- to add fields that are not in the model to the serializer you should add them outside the meta class like this
		another = serializers.Boolean(default=True, required=True)
		then you can add it to the fields of the meta class
		model = test
		fields = ['one', 'two', 'another'] # added another to the fields
	- to validate a specific fields you should make a function called validate_<field name>(self, field_value)
		field value is the value of that specific field you want to examine during the evaluation
	- to validate generally you can override the validate method called validate(self, attrs) where attrs is all the attrs received from the request
	- when calling serialize.save() it will create a new instance of the model to the db using the function create(self, validated_data)
		you can inspect and override the create method to ensure extra checks and the returning the model instance
	- when calling serialize.save(instance) with instance being the return value of a previous serializer.save() it will update that instance
		here is a prototype:
			def update(self, instance, validated_data):
		     instance.email = validated_data.get('email', instance.email)
		     instance.content = validated_data.get('content', instance.content)
		     instance.created = validated_data.get('created', instance.created)
		     instance.save()
		     return instance
	- add more docs here
	- why drf docs dont explain every available thing you could do with their classes ?
"""


class InputSerializer(serializers.ModelSerializer):
	
	password2 = serializers.CharField(write_only=True, required=True)
		
	class Meta:
		model = User
		fields = ['username', 'email', 'password', 'password2']
		extra_kwargs = {
			"password" : {'required' : True , 'write_only' : True}
		}
	
	def validate(self, attrs):
		if attrs['password'] != attrs.get('password2'):
			raise serializers.ValidationError("passwords missmatch")
		return attrs
	

	def create(self, validated_data):
		try:
			user : User = User.objects.create_user(validated_data['email'], 
				validated_data['username'],
				validated_data['password'])
		except ValueError as e :
			raise serializers.ValidationError(str(e))
		return user


class AuthProviderSerializer(serializers.ModelSerializer):
	class Meta:
		model = AuthProvider
		fields = ['name']

# serializer to get user data except for last_login and password
class UserDetailSerializer(serializers.ModelSerializer):
	auth_provider = AuthProviderSerializer(many=True)
	class Meta:
		model = User
		fields = ['id' ,'username','email', 'icon_url','is_active',
			'last_login', "auth_provider", "two_factor_enabled"]


# serializer to update common user info
class UpdateUserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ["username", "email"]

	def validate_username(self, value):
		if User.objects.filter(username=value).exists():
			raise serializers.ValidationError(f"Username : {value} Already exists")
		return value
	def validate_email(self, value):
		if User.objects.filter(email=value).exists():
			raise serializers.ValidationError(f"Email : {value} Already exists")
		return value
	
	def validate(self, attrs : dict):
		for key in attrs.keys():
			if key not in self.get_fields():
				raise serializers.ValidationError("Invalid key provided")
		return attrs
	
	def update(self, instance: User, validated_data):
		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		instance.save()
		email = validated_data.get("email")
		if email:
			auth, created = AuthProvider.objects.get_or_create(name="Email")
			instance.auth_provider.add(auth)
		return instance



class UserLogin(serializers.Serializer):

	email = serializers.EmailField(required=True)
	password = serializers.CharField(write_only=True, required=True)

	def validate(self, attrs):
		email = attrs.get('email')
		password = attrs.get('password')
		try:
			user : User = get_object_or_404(User, email=email)
			if user.auth_provider.filter(name="Email").exists() is False:
				raise serializers.ValidationError(detail="user doesn't have an Email Auth Provider")
		except Http404:
			raise serializers.ValidationError(detail='user not found')
		if not user.is_active:
			raise serializers.ValidationError(detail="Your Account has been permanently banned.")
		if not check_password(password, user.password):
			raise serializers.ValidationError(detail='wrong password')
		attrs['user'] = user
		return attrs


class UserTwoFactorSerial(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ['username', "two_factor_enabled", "two_factor_secret"]
	
	def update(self, instance, validated_data):
		for attr, value in validated_data.items():
			setattr(instance, attr, value)
		instance.save()
		return instance


class SessionSerializer(serializers.Serializer):
	user_id = serializers.UUIDField(required=True)

	def validate(self, attrs):
		try:
			user_id = attrs["user_id"]
			user = get_object_or_404(User, id=user_id)
			return attrs
		except Http404:
			raise serializers.ValidationError("user not found http404")


"""
	TODO : DONE
		- password serialized
		- password length should be at least 8 chars
		- just call instance.set_password(new_password) to update it 
"""
class UpdatePasswordSerializer(serializers.Serializer):
	new_password = serializers.CharField(required=True)
	old_password = serializers.CharField(required=True)


	def validate_old_password(self, value):
		if not self.instance.check_password(value):
			raise serializers.ValidationError("Wrong Password")
		return value

	def validate_new_password(self, value):
		if len(value) < 8:
			raise serializers.ValidationError("Password too short")
		return value

	def update(self, instance : User, validated_data : dict):
		password = validated_data["new_password"]
		instance.set_password(password)
		instance.save()
		email, created = AuthProvider.objects.get_or_create(name="Email")
		instance.auth_provider.add(email)
		return instance