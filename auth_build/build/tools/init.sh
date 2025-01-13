#!/bin/bash

sleep 2
./manage.py makemigrations
./manage.py migrate

exec "$@"