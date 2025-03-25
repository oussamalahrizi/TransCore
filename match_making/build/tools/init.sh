#!/bin/bash

sleep 3


python3 manage.py makemigrations
python3 manage.py makemigrations matchmaking
python3 manage.py migrate

exec $@