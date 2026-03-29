#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker CLI is not installed or not on PATH." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon is not reachable. Start Docker and try again." >&2
  exit 1
fi

echo "==> Starting Docker cleanup..."

if docker compose version >/dev/null 2>&1; then
  compose_cmd=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose_cmd=(docker-compose)
fi

if [[ -f "docker-compose.yml" || -f "docker-compose.yaml" ]]; then
  if [[ ${#compose_cmd[@]} -gt 0 ]]; then
    echo "==> Removing Compose stack resources (containers, networks, volumes, images)..."
    "${compose_cmd[@]}" down --remove-orphans --volumes --rmi all || true
  else
    echo "==> Compose file found, but no compose command available. Skipping compose down."
  fi
fi

container_ids="$(docker ps -aq)"
if [[ -n "$container_ids" ]]; then
  echo "==> Removing all containers..."
  docker rm -f $container_ids >/dev/null
fi

image_ids="$(docker images -aq)"
if [[ -n "$image_ids" ]]; then
  echo "==> Removing all images..."
  docker rmi -f $image_ids >/dev/null
fi

network_ids="$(docker network ls -q --filter type=custom)"
if [[ -n "$network_ids" ]]; then
  echo "==> Removing custom networks..."
  docker network rm $network_ids >/dev/null || true
fi

volume_ids="$(docker volume ls -q)"
if [[ -n "$volume_ids" ]]; then
  echo "==> Removing all volumes..."
  docker volume rm -f $volume_ids >/dev/null || true
fi

echo "==> Pruning builder cache and any remaining unused resources..."
docker builder prune -af >/dev/null || true
docker system prune -af --volumes >/dev/null || true

echo "==> Docker cleanup complete."
