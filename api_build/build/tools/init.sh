#!/bin/bash

HOST=api-db
PORT=5432

echo "Waiting for database at $HOST:$PORT to be available..."

check="nc -zv $HOST $PORT"

while ! $check; do
  sleep 1
done

echo "Database is up! Starting the application..."

./manage.py makemigrations
./manage.py migrate

exec "$@"