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

Requisitos (Fedora): Docker Engine con el plugin Compose, Node.js 24, Git.

```bash
docker compose up -d                 # PostgreSQL local
cd backend && npm install && npx prisma migrate dev && npm run start:dev
cd frontend && npm install && npm run dev   # http://localhost:5173
```

_(Estos comandos funcionan a medida que se completan las tareas del plan.)_
