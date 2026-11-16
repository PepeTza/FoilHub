#!/usr/bin/env bash
set -euo pipefail

SOURCE="${CARD_CATALOG_SOURCE:-digimoncardio}"
CONTAINER_ID="$(docker ps -q -f name=foilhub_api | head -n 1 || true)"

if [ -z "$CONTAINER_ID" ]; then
  echo "No se encontró ninguna réplica de 'foilhub_api' corriendo en este nodo." >&2
  echo "Ejecuta 'docker service ps foilhub_api --filter desired-state=running' para ver en qué nodo está y corre este script ahí." >&2
  exit 1
fi

echo "Importando catálogo (CARD_CATALOG_SOURCE=${SOURCE}) en el contenedor ${CONTAINER_ID}..."
docker exec -e "CARD_CATALOG_SOURCE=${SOURCE}" "$CONTAINER_ID" npm run cards:import:prod
