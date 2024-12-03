#!/bin/bash

service redis-server restart

exec "$@"
