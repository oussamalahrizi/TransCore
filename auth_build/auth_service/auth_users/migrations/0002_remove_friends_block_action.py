# Generated by Django 5.1.3 on 2025-03-21 06:54

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auth_users', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='friends',
            name='block_action',
        ),
    ]
