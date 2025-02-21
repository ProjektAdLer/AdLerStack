#!/bin/bash
set -e

MODE="$1"
if [ "$MODE" != "snapshot" ] && [ "$MODE" != "restore" ]; then
  echo "Usage: $0 [snapshot|restore]"
  exit 1
fi

# Get project name from compose config
PROJECT_NAME=$(docker compose config --format json | jq -r '.name')

# Create or use backup directory
BACKUP_DIR="./volume_snapshots"

# Build the custom image (for zstd)
docker build -f Dockerfile-backup-image -t alpine-zstd .

# Make sure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "=== Stopping containers..."
docker compose down

# Gather volumes belonging to this project
VOLUMES=$(docker volume ls -q --filter "label=com.docker.compose.project=$PROJECT_NAME")

if [ "$MODE" = "snapshot" ]; then
  echo -e "\n=== Backing up volumes for project '$PROJECT_NAME'..."
  # Remove old backups, recreate the directory
  rm -rf "$BACKUP_DIR"/*
  echo -e "Storing docker compose config hash..."
  docker compose config | sha256sum | awk '{print $1}' > "$BACKUP_DIR/docker-compose.yml.hash"
  for VOLUME in $VOLUMES; do
    echo "Backing up $VOLUME..."
    time docker run --rm \
      -v "$VOLUME":/source \
      -v "$(pwd)/$BACKUP_DIR":/backup \
      alpine-zstd \
      sh -c "tar -cf - -C /source . | zstd -T0 --long=31 > /backup/${VOLUME}.zst"
  done
  echo -e "\nSnapshot completed successfully to: $BACKUP_DIR"
else
  STORED_HASH=$(cat "${BACKUP_DIR}/docker-compose.yml.hash")
  CURRENT_HASH=$(docker compose config | sha256sum | awk '{print $1}')
  if [ "$STORED_HASH" != "$CURRENT_HASH" ]; then
    echo "ERROR: docker compose config has changed. Recreate the containers and take a fresh snapshot."
    exit 1
  fi

  echo -e "\n=== Restoring volumes for project '$PROJECT_NAME'..."
  for VOLUME in $VOLUMES; do
    if [ ! -f "${BACKUP_DIR}/${VOLUME}.zst" ]; then
      echo "ERROR: Backup file not found for volume: $VOLUME"
      echo "Expected file: ${BACKUP_DIR}/${VOLUME}.zst"
      exit 1
    fi
    echo "Restoring $VOLUME..."
    docker run --rm \
      -v "$VOLUME":/target \
      -v "$(pwd)/$BACKUP_DIR":/backup \
      alpine-zstd \
      sh -c "rm -rf /target/* /target/..?* /target/.[!.]* && zstd --memory=2048MB -d -c /backup/${VOLUME}.zst | tar -xf - -C /target"
  done
  echo -e "\nRestore completed successfully from: $BACKUP_DIR"
fi

echo -e "\n=== Restarting containers..."
docker compose up -d --wait --force-recreate