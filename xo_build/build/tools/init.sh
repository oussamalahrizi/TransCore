#!/bin/bash

# wait for redis server to start and database to be ready using the ping command
# while ! ping -c 1 -W 1 db &>/dev/null; do
#     echo "Waiting for database..."
#     sleep 1
# done
# while ! ping -c 1 -W 1 redis &>/dev/null; do
#     echo "Waiting for redis..."
#     sleep 1
# done

./manage.py makemigrations

./manage.py migrate

exec $@