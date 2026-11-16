#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ -z "${REGISTRY:-}" ]; then
  echo "Uso: REGISTRY=docker.io/<usuario> $0 <tag>" >&2
  echo "Ejemplo: REGISTRY=docker.io/miusuario $0 v0.1.0" >&2
  exit 1
fi

TAG="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

API_IMAGE="${REGISTRY}/foilhub-api:${TAG}"
NGINX_IMAGE="${REGISTRY}/foilhub-nginx:${TAG}"

echo "Construyendo ${API_IMAGE}..."
docker build -t "$API_IMAGE" "${ROOT_DIR}/backend"

echo "Construyendo ${NGINX_IMAGE} (APP_VERSION=${TAG})..."
docker build --build-arg "APP_VERSION=${TAG}" -t "$NGINX_IMAGE" -f "${ROOT_DIR}/nginx/Dockerfile" "$ROOT_DIR"

echo "Subiendo ${API_IMAGE}..."
docker push "$API_IMAGE"

echo "Subiendo ${NGINX_IMAGE}..."
docker push "$NGINX_IMAGE"

echo "Listo: ${API_IMAGE} y ${NGINX_IMAGE} publicadas."
