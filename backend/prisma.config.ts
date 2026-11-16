import { defineConfig } from 'prisma/config';

// Prisma 7 ya no carga .env por su cuenta. En desarrollo se lee backend/.env si existe;
// en Docker/Swarm DATABASE_URL lo arma docker/entrypoint.sh.
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables del entorno.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // `prisma generate` no necesita conexión, por eso no se exige DATABASE_URL aquí.
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
