#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ -z "${REGISTRY:-}" ]; then
  echo "Uso: REGISTRY=docker.io/<usuario> $0 <tag>" >&2
  echo "Ejemplo: REGISTRY=docker.io/miusuario $0 v0.1.0" >&2
  exit 1
fi

export TAG="$1"
export REGISTRY
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

docker stack deploy --with-registry-auth -c "${ROOT_DIR}/docker-stack.yml" foilhub
