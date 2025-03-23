#!/bin/bash

HOST=game-db
PORT=5432

echo "Waiting for database at $HOST:$PORT to be available..."

check="nc -z $HOST $PORT"

while ! $check; do
  sleep 1
done

echo "Database is up! Starting the application..."

python3 manage.py makemigrations
python3 manage.py makemigrations pong_game
python3 manage.py migrate
python3 manage.py check

exec "$@"