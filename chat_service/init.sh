#!/bin/bash

echo "waiting"
sleep 5s
echo "done"

python3 manage.py makemigrations
python3 manage.py migrate
exec "$@"