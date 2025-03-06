#!/bin/bash
sleep 1
./manage.py makemigrations
./manage.py migrate
exec "$@"