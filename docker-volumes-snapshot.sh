#!/bin/bash
set -e

MODE="$1"
if [ "$MODE" != "snapshot" ] && [ "$MODE" != "restore" ]; then
  echo "Usage: $0 [snapshot|restore]"
  exit 1
fi

# Check if Docker is installed
if ! docker info &> /dev/null; then
  echo "Error: Docker is either not installed, not running, or requires sudo."
  exit 1
fi

PROJECT_NAME=$(docker compose config --format json | jq -r '.name')
BACKUP_VOLUME="${PROJECT_NAME}_backup"

docker build -f Dockerfile-backup-image -t alpine-zstd .

docker volume create --name "$BACKUP_VOLUME"

VOLUMES=$(docker volume ls -q --filter "label=com.docker.compose.project=$PROJECT_NAME")

if [ "$MODE" = "snapshot" ]; then
  echo "=== Stopping containers..."
  docker compose down

  echo -e "\n=== Backing up volumes for project '$PROJECT_NAME'..."
  docker run --rm -v "$BACKUP_VOLUME:/backup" alpine sh -c "rm -rf /backup/*"
  echo -e "Storing docker compose config hash..."
  (docker compose config | sha256sum | awk '{print $1}' | docker run --rm -i -v "$BACKUP_VOLUME:/backup" alpine sh -c "cat > /backup/docker-compose.yml.hash") &
  for VOLUME in $VOLUMES; do
    echo "Backing up $VOLUME..."
    docker run --rm \
      -v "$VOLUME:/source" \
      -v "$BACKUP_VOLUME:/backup" \
      alpine-zstd \
      sh -c "tar -cf - -C /source . | zstd -T0 --long=31 > /backup/${VOLUME}.zst" \
      &  # Run in background for parallel backup
  done
  wait
  echo -e "\nSnapshot completed successfully in volume: $BACKUP_VOLUME"
else
  STORED_HASH=$(docker run --rm -v "$BACKUP_VOLUME:/backup" alpine cat /backup/docker-compose.yml.hash)
  CURRENT_HASH=$(docker compose config | sha256sum | awk '{print $1}')
  if [ "$STORED_HASH" != "$CURRENT_HASH" ]; then
    echo "ERROR: docker compose config has changed. Recreate the containers and take a fresh snapshot."
    exit 1
  fi

  echo "=== Stopping containers..."
  docker compose kill

  echo -e "\n=== Restoring volumes for project '$PROJECT_NAME'..."
  for VOLUME in $VOLUMES; do
    echo "Restoring $VOLUME..."
    docker run --rm \
      -v "$VOLUME:/target" \
      -v "$BACKUP_VOLUME:/backup" \
      alpine-zstd \
      sh -c '
        if [ ! -f "/backup/$1.zst" ]; then
          echo "ERROR: Backup file not found for volume: $1"
          echo "Did you take a snapshot before restoring?"
          exit 1
        fi
        rm -rf /target/* /target/..?* /target/.[!.]*
        zstd --memory=2048MB -d -c "/backup/$1.zst" | tar -xf - -C /target
      ' \
      -- "$VOLUME" \
      &  # Run in background for parallel restore
  done
  wait
  echo -e "\nRestore completed successfully"
fi

echo -e "\n=== Restarting containers..."
docker compose up -d --wait --force-recreate

echo -e "\n=== Done"
