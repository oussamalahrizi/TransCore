#!/bin/bash

sleep 3
./manage.py makemigrations
./manage.py migrate
exec "$@"