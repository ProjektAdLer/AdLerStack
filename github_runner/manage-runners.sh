#!/bin/bash

case "$1" in
    "start")
        for i in {1..4}; do
            export COMPOSE_PROJECT_NAME="github-runner-$i"
            echo "Starting $COMPOSE_PROJECT_NAME..."
            docker compose up -d
            sleep 5  # Wait between starts
        done
        ;;
    "stop")
        for i in {1..4}; do
            export COMPOSE_PROJECT_NAME="github-runner-$i"
            echo "Stopping $COMPOSE_PROJECT_NAME..."
            docker compose down
        done
        ;;
    *)
        echo "Usage: $0 {start|stop}"
        exit 1
        ;;
esac