import { readSecret } from './read-secret.js';

/**
 * URL de conexión a Postgres.
 * - Si existe `DATABASE_URL` (desarrollo, tests, o la que exporta docker/entrypoint.sh), se usa tal cual.
 * - Si no, se arma con `DB_HOST`, `DB_PORT` (5432), `DB_NAME`, `DB_USER` y la contraseña de
 *   `DB_PASSWORD_FILE` (Swarm: /run/secrets/db_password) o `DB_PASSWORD`.
 *
 * Así también funciona un `docker exec … npm run cards:import:prod`, que no pasa por el entrypoint.
 */
export function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  if (!env.DB_HOST) {
    throw new Error(
      'Falta la configuración de la base de datos: define DATABASE_URL, o DB_HOST, DB_NAME, DB_USER y DB_PASSWORD (o DB_PASSWORD_FILE)',
    );
  }

  const user = required(env, 'DB_USER');
  const name = required(env, 'DB_NAME');
  const password = readSecret('DB_PASSWORD', env);
  const port = env.DB_PORT || '5432';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${env.DB_HOST}:${port}/${encodeURIComponent(name)}?schema=public`;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(
      `Falta ${name} (necesaria cuando se usa DB_HOST en vez de DATABASE_URL)`,
    );
  }
  return value;
}
