# Generated by Django 5.1.3 on 2024-11-25 23:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth_users', '0002_authprovider_remove_user_auth_provider_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='authprovider',
            name='name',
            field=models.CharField(choices=[('email', 'Email'), ('google', 'Google'), ('intra', 'Intra')], default='email', max_length=50, unique=True),
        ),
    ]
