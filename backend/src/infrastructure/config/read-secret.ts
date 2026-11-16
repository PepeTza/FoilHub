import { readFileSync } from 'node:fs';

/**
 * Lee un secreto. En Swarm viene de un archivo (`<NAME>_FILE`, p. ej. /run/secrets/jwt_secret);
 * en desarrollo, de la variable `<NAME>` (.env).
 */
export function readSecret(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const file = env[`${name}_FILE`];
  if (file) {
    try {
      return readFileSync(file, 'utf8').trim();
    } catch (error) {
      throw new Error(`No se pudo leer ${name}_FILE (${file})`, {
        cause: error,
      });
    }
  }

  const value = env[name];
  if (value) {
    return value;
  }
  throw new Error(
    `Falta la configuración ${name}: define ${name} o ${name}_FILE`,
  );
}
