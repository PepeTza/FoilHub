# CLAUDE.md — FoilHub

Instrucciones para Claude Code en este repositorio. Léelas completas antes de cada tarea.

## Qué es el proyecto

FoilHub es un sitio para intercambiar cartas del Digimon Card Game. Los usuarios se registran con usuario y contraseña, publican ofertas ("doy N de la carta X, quiero M de la carta Y"), reciben propuestas y las aceptan o rechazan. Es un proyecto universitario cuyo objetivo es **desplegar una aplicación funcional orquestada con Docker Swarm** en AWS, siguiendo **Clean Architecture**.

Equipo de 2 personas. Cada una trabaja en su propia rama y su propia sesión de Claude Code.

## Documentos que mandan

1. `docs/ARCHITECTURE.md`: dominio, casos de uso, puertos, esquema de BD, **contrato de la API**, archivos de referencia de Swarm. Es la fuente de verdad.
2. `docs/PLAN.md`: tareas con ID (A1, B5, …), dueño, dependencias y criterios de aceptación.
3. `docs/DEPLOY-AWS.md`: runbook de AWS y guion de la demo.

Cuando te pidan una tarea por ID, lee su sección en `docs/PLAN.md` y cumple **todos** sus criterios de aceptación. Si la tarea obliga a desviarse del contrato de la API o del modelo de dominio, detente y explícalo en lugar de cambiarlo por tu cuenta.

## Stack y versiones (fijadas)

| Pieza | Versión | Nota |
|---|---|---|
| Node.js | 24 LTS (mínimo 22.22.3 para el CLI de Nest 12) | Imagen base `node:24-alpine` |
| NestJS | 12.x | Core en ESM |
| Prisma ORM | **7.x** | `prisma@latest` instala Prisma 8 (release candidate, API distinta). Usa siempre `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7` y la documentación de https://www.prisma.io/docs/orm/v7 . No migres a Prisma 8. |
| PostgreSQL | 17 (`postgres:17-alpine`) | No usar 18: cambia la ruta del volumen de datos |
| nginx | `nginx:stable-alpine` | Sirve el frontend y hace de reverse proxy |
| Frontend | React + Vite + TypeScript | `react-router` |
| Estilos | Tailwind CSS 4.x con `@tailwindcss/vite` | Sin `tailwind.config.js`: tokens con `@theme` en `frontend/src/styles/theme.css` |
| Hash | `bcryptjs` | JS puro, sin compilación nativa |
| Validación HTTP | `class-validator` + `class-transformer` | Solo en DTOs de la capa 3 |

Antes de usar una API de Prisma 7 o NestJS 12 de la que no estés seguro, revisa la documentación oficial de esa versión en vez de suponer. Las dos cambiaron bastante respecto a versiones anteriores (Prisma 7: `prisma.config.ts`, generador `prisma-client` con `output` obligatorio, driver adapter `@prisma/adapter-pg`).

**Módulos:** el backend usa ESM (opción por defecto de `nest new` en v12). Las importaciones relativas llevan extensión `.js` (`import { User } from './user.entity.js'`). Si la tarea A1 decide usar CommonJS, se actualiza esta línea.

## Estructura del repo

```
foilhub/
├── CLAUDE.md
├── docs/                    # ARCHITECTURE.md, PLAN.md, DEPLOY-AWS.md
├── backend/                 # NestJS + Prisma
│   ├── prisma/              # schema.prisma, migrations/, seed/cards.sample.json
│   ├── prisma.config.ts
│   ├── docker/entrypoint.sh
│   ├── Dockerfile
│   ├── src/
│   │   ├── domain/              # CAPA 1
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── services/        # trade-matcher.ts
│   │   │   └── errors/
│   │   ├── application/         # CAPA 2
│   │   │   ├── ports/
│   │   │   └── use-cases/{auth,cards,offers,proposals}/
│   │   ├── interface-adapters/  # CAPA 3
│   │   │   ├── http/{controllers,dto,presenters,guards,decorators,filters}/
│   │   │   ├── persistence/{repositories,mappers}/
│   │   │   └── di-tokens.ts
│   │   ├── infrastructure/      # CAPA 4
│   │   │   ├── config/          # lectura de env y /run/secrets
│   │   │   ├── prisma/          # PrismaService
│   │   │   ├── security/        # BcryptPasswordHasher, JwtTokenService
│   │   │   ├── external/        # DigimonCardIoCatalogProvider, JsonFileCatalogProvider
│   │   │   ├── system/          # CryptoIdGenerator, SystemClock
│   │   │   ├── health/
│   │   │   ├── cli/             # import-cards.ts
│   │   │   ├── modules/         # módulos Nest (cableado con useFactory)
│   │   │   └── main.ts
│   │   └── generated/prisma/    # cliente generado por Prisma (no editar, en .gitignore)
│   └── test/
│       ├── fakes/               # repos en memoria, FakePasswordHasher, FixedClock...
│       └── e2e/
├── frontend/                # React + Vite + Tailwind 4
│   └── src/
│       ├── styles/theme.css     # ÚNICO lugar con colores, fuentes, radios, sombras (@theme)
│       ├── components/ui/       # genéricos: Button, TextField, Modal, Toast...
│       ├── components/trading/  # de la app: CardTile, OfferCard, StatusBadge...
│       ├── features/ y pages/   # pantallas: solo componen los componentes de arriba
│       └── pages/dev/UiCatalog  # /_ui, catálogo de componentes (solo en desarrollo)
├── nginx/                   # Dockerfile (multi-stage: build del frontend + nginx) y nginx.conf
├── docker-compose.yml       # SOLO desarrollo local (Postgres)
├── docker-stack.yml         # Swarm (producción)
└── scripts/                 # create-secrets.sh, build-push.sh, deploy.sh, import-cards.sh
```

## Reglas de arquitectura (no negociables)

1. **Regla de dependencia:** `infrastructure → interface-adapters → application → domain`. Nunca al revés.
2. `domain/` y `application/` son **TypeScript puro**: sin `@nestjs/*`, `@prisma/*`, `src/generated/**`, `class-validator`, `bcryptjs`, `jsonwebtoken`, `process.env`, `fs` ni `fetch`. Sin decoradores.
3. `interface-adapters/` no importa nada de `infrastructure/`.
4. Los casos de uso **no** llevan `@Injectable()`. Se instancian en los módulos Nest de `infrastructure/modules/` con `useFactory` + `inject` (ejemplo en `docs/ARCHITECTURE.md` §2). Los repositorios Prisma tampoco llevan decoradores: reciben el `PrismaClient` por constructor.
5. Los puertos son `interface` en `application/ports/`. Los tokens de DI (`Symbol`) están en `interface-adapters/di-tokens.ts`.
6. Las entidades tienen constructor privado, `static create()` (valida invariantes) y `static restore()` (desde persistencia). El estado cambia solo mediante métodos con nombre del negocio (`offer.cancel(userId)`), nunca asignando campos desde afuera.
7. La lógica de negocio (reglas de match, transiciones de estado, quién puede hacer qué) vive en el dominio. Un controller solo traduce HTTP ↔ caso de uso. Un repositorio solo persiste y consulta.
8. Los casos de uso reciben y devuelven **tipos planos**. Las entidades no salen de la capa 2: los presenters de la capa 3 construyen los DTOs de respuesta del contrato.
9. Los errores de negocio son subclases de `DomainError` con un `code`. `DomainExceptionFilter` (capa 3) los traduce a HTTP según la tabla de `docs/ARCHITECTURE.md` §3. No lances `HttpException` desde el dominio ni desde los casos de uso.
10. Mappers Prisma ↔ dominio en `interface-adapters/persistence/mappers/`. Los tipos de Prisma nunca llegan a `application/`.
11. ESLint con `no-restricted-imports` hace cumplir 2 y 3. Si `npm run lint` falla por una importación prohibida, corrige el diseño; **no** desactives la regla.

## Convenciones de código

- Identificadores y nombres de archivo en **inglés**. Textos de la interfaz y mensajes de error para el usuario en **español**.
- Archivos en kebab-case con sufijo de rol: `create-trade-offer.use-case.ts`, `trade-offer.entity.ts`, `card-code.vo.ts`, `prisma-trade-offer.repository.ts`, `trade-offer.mapper.ts`, `offers.controller.ts`, `create-offer.request.dto.ts`.
- Un caso de uso por archivo, una clase con un método `execute(input)`.
- `strict: true` en TypeScript. Prohibido `any` (usa `unknown` y estrecha el tipo).
- Nada de `console.log` en código de producción: usa el `Logger` de Nest en las capas 3 y 4.
- Commits con Conventional Commits en español: `feat(offers): crear caso de uso CancelTradeOffer`.

## Reglas del frontend (sistema visual)

1. Los estilos se escriben **solo** con clases de Tailwind que usan los tokens de `src/styles/theme.css`. Nada de colores sueltos (`#1a1a2e`, `rgb(...)`, `hsl(...)`), valores arbitrarios de color (`bg-[#...]`), `style={{ color: ... }}` ni archivos CSS por página. `npm run check:styles` lo verifica.
2. Las páginas y `features/` **componen** componentes de `components/ui/` y `components/trading/`. Si hace falta algo que no existe (otra variante de botón, un componente nuevo), se agrega ahí, con su ejemplo en `/_ui`, y después se usa. No se crean botones, inputs o tarjetas a mano dentro de una página.
3. Una carta siempre se muestra con `CardTile` y una oferta siempre con `OfferCard`.
4. **Mobile first:** cada pantalla debe funcionar a 360 px de ancho sin scroll horizontal. Revisa también a 1280 px.
5. Accesibilidad: foco visible, todo usable con teclado, `alt` en imágenes de cartas, contraste AA. Las animaciones (brillo foil) respetan `prefers-reduced-motion`.
6. Cada pantalla tiene estados de carga (`Skeleton`/`Spinner`), vacío (`EmptyState`) y error (`ErrorState`). Las acciones muestran un `Toast` de éxito o error.
7. No agregues librerías de componentes (MUI, Chakra, Ant, etc.) ni otra solución de estilos.
8. Si cambias un token del tema, revisa `/_ui` para confirmar que nada se rompió.

## Tests

- **Dominio:** tests unitarios sin mocks ni base de datos. Cada invariante y cada transición de estado tiene al menos un test (caso válido y caso inválido).
- **Casos de uso:** con los fakes en memoria de `backend/test/fakes/`. No uses Prisma ni Nest en estos tests.
- **e2e:** levantan la app Nest contra el Postgres de `docker-compose.yml` (base `foilhub_test`) y prueban con `supertest`.
- Usa el runner que generó `nest new` en la tarea A1; no mezcles Jest y Vitest.
- Una tarea no está terminada si `npm run lint`, `npm run build` o `npm test` fallan.

## Comandos

```bash
# Desarrollo (desde la raíz)
docker compose up -d                      # Postgres local en :5432
cd backend && npm run start:dev           # API en :3000
cd frontend && npm run dev                # Vite en :5173 (proxy /api → :3000)

# Backend
npm run lint && npm run build && npm test
npm run test:e2e
npx prisma migrate dev --name <nombre>    # crear migración (solo en desarrollo)
npx prisma generate
npm run cards:import                      # importar catálogo (CARD_CATALOG_SOURCE=file|digimoncardio)

# Swarm local
docker swarm init
./scripts/create-secrets.sh
./scripts/build-push.sh <tag>
REGISTRY=docker.io/<usuario> TAG=<tag> docker stack deploy --with-registry-auth -c docker-stack.yml foilhub
```

Los scripts de `package.json` y de `scripts/` se crean en las tareas del plan. Si alguno no existe todavía, es porque su tarea no se ha hecho.

## Reglas de Docker y Swarm

- `docker-stack.yml` **nunca** lleva `build:`. Swarm descarga imágenes de un registry (Docker Hub). Las imágenes se etiquetan con versión (`v0.3.0` o el SHA corto de git), no solo `latest`.
- Los secretos **nunca** van en variables de entorno ni en el repo. En Swarm se leen de `/run/secrets/<nombre>` mediante variables `*_FILE` (`DB_PASSWORD_FILE`, `JWT_SECRET_FILE`). En desarrollo se aceptan `DB_PASSWORD`/`JWT_SECRET` desde `.env` (que está en `.gitignore`).
- Los healthchecks usan `wget -qO- http://127.0.0.1:...` (las imágenes Alpine no traen `curl`; `127.0.0.1` evita que `localhost` resuelva a IPv6).
- El healthcheck de Docker de la API usa `/api/health/live` (no consulta la BD). `/api/health` sí consulta la BD y es para monitoreo y la demo. No los mezcles: si el healthcheck dependiera de la BD, un reinicio de Postgres tumbaría todas las réplicas.
- La API es stateless: nada de sesiones ni cachés en memoria que tengan que compartirse entre réplicas.
- La API debe manejar `SIGTERM` (`app.enableShutdownHooks()`) para que los rolling updates no corten peticiones.
- La base de datos no publica puertos en Swarm y solo está en la red `backend`.
- En Fedora (SELinux), los bind mounts de `docker-compose.yml` llevan `:z`.

## Qué no hacer

- No ejecutes `/init` ni reescribas este archivo; propón cambios en el PR si algo está desactualizado.
- No cambies el contrato de la API (`docs/ARCHITECTURE.md` §6) sin que la tarea lo pida.
- No instales Prisma 8, ni `@prisma/orm-postgres`, ni Firebase.
- No agregues dependencias grandes (ORMs extra, frameworks de UI pesados, Redis, colas) sin que la tarea lo pida.
- No hagas commits de `.env`, de secretos, de `node_modules/`, `dist/` ni `src/generated/`.
- No toques archivos que son de la otra persona (tabla de dueños en `docs/PLAN.md`) salvo que la tarea lo indique.
