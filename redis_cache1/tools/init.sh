#!/bin/bash

service redis-server restart

redis-server --protected-mode no --bind 0.0.0.0 --port 6380
