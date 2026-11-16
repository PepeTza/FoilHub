#!/bin/sh
set -e

if [ -n "$DB_PASSWORD_FILE" ] && [ -f "$DB_PASSWORD_FILE" ]; then
  DB_PASSWORD="$(cat "$DB_PASSWORD_FILE")"
fi

if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}?schema=public"
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
  npx prisma migrate deploy
fi

exec node dist/infrastructure/main.js
