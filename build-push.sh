#!/bin/sh
set -e

IMAGE="sizuwanoadi/pharmalink-admin"
TAG="${1:-latest}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api-pharmalink.sizu.dev/api/v1}"

echo "Building $IMAGE:$TAG ..."
docker build \
  --build-arg VITE_API_BASE_URL="$VITE_API_BASE_URL" \
  -t "$IMAGE:$TAG" \
  .

echo "Pushing $IMAGE:$TAG ..."
docker push "$IMAGE:$TAG"

echo "Done: $IMAGE:$TAG"
