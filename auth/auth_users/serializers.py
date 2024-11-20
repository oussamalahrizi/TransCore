from django.contrib.auth import models
from rest_framework import serializers

from .models import User

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
			"password" : {'required' : True}
		}

	def validate_username(self, value):
		if User.objects.filter(username=value).exists():
			raise serializers.ValidationError("username already exists!")
		return value
	
	def validate_email(self, value):
		if User.objects.filter(email=value).exists():
			raise serializers.ValidationError("email already exists!")
		return value
	
	def validate(self, attrs):
		if attrs['password'] != attrs.get('password2'):
			raise serializers.ValidationError("passwords missmatch")
		return attrs
	
	def to_internal_value(self, data):
		allowed_fields = set(self.fields.keys())
		print(allowed_fields)
		extra_fields = set(data.keys()) - allowed_fields
		if extra_fields:
			raise serializers.ValidationError("Extra fields not allowed")
		return super().to_internal_value(data)
	
	def create(self, validated_data):
		try:
			user = User.objects.create_user(validated_data['email'], 
				validated_data['username'],
				validated_data['password'])
		except ValueError as e :
			raise serializers.ValidationError(str(e))
		return user