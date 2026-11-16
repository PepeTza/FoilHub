#!/usr/bin/env bash
set -euo pipefail

create_if_missing() {
  local name="$1"
  local bytes="$2"

  if docker secret inspect "$name" >/dev/null 2>&1; then
    echo "Secret '$name' ya existe, se omite."
  else
    openssl rand -hex "$bytes" | tr -d '\n' | docker secret create "$name" - >/dev/null
    echo "Secret '$name' creado."
  fi
}

create_if_missing db_password 24
create_if_missing jwt_secret 32
