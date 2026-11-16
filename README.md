# FoilHub

Plataforma web para intercambiar cartas del **Digimon Card Game**. Los usuarios publican ofertas ("doy N de la carta X, quiero M de la carta Y"), encuentran ofertas que hacen match con las suyas y aceptan o rechazan propuestas de intercambio.

Proyecto universitario: aplicación con **Clean Architecture** desplegada en **AWS** y orquestada con **Docker Swarm**.

## Stack

- **Backend:** NestJS 12 + TypeScript, Prisma ORM 7, PostgreSQL 17
- **Frontend:** React + Vite + TypeScript
- **Infraestructura:** nginx (reverse proxy + frontend estático), Docker Swarm (3 nodos EC2), Docker secrets, healthchecks, rolling updates

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Capas, modelo de dominio, casos de uso, esquema de BD, contrato de la API, stack de Swarm |
| [`docs/PLAN.md`](docs/PLAN.md) | Plan de implementación para 2 personas, tareas y criterios de aceptación |
| [`docs/DEPLOY-AWS.md`](docs/DEPLOY-AWS.md) | Despliegue en AWS paso a paso y guion de la demo |
| [`CLAUDE.md`](CLAUDE.md) | Reglas para Claude Code en este repo |

## Desarrollo local

Requisitos (Fedora): Docker Engine con el plugin Compose (o Podman con `podman compose`), Node.js 24 (mínimo 22.22.3), Git.

### 1. Base de datos local (PostgreSQL 17 + Adminer)

Levanta el contenedor de PostgreSQL y verifica que se crearon las bases `foilhub` y `foilhub_test`:

```bash
docker compose up -d
docker compose exec db psql -U foilhub -l
```

Opcionalmente puedes inspeccionar la base de datos con Adminer en `http://localhost:8081`:
- **Sistema:** PostgreSQL
- **Servidor:** `db`
- **Usuario:** `foilhub`
- **Contraseña:** `foilhub_dev`
- **Base de datos:** `foilhub`

> Nota para Fedora con SELinux: el montaje en `./docker/postgres-init` ya incluye `:z` en `docker-compose.yml`.

### 2. Backend (NestJS + Prisma 7)

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev
```

La API escucha en `http://localhost:3000` bajo el prefijo `/api` (healthcheck en `http://localhost:3000/api/health`).

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173` (con proxy `/api` → `http://localhost:3000`).

_(Algunas funciones se completan conforme avanzan las tareas del plan.)_
