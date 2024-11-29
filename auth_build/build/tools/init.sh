#!/bin/bash
sleep 5
./manage.py makemigrations
./manage.py migrate
exec $@