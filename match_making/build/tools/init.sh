#!/bin/bash

sleep 3

./manage.py migrate
./manage.py makemigrations

exec $@