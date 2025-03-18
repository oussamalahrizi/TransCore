#!/bin/bash

sleep 3s;
./manage.py makemigrations
./manage.py migrate
exec "$@"