import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSecret } from './read-secret.js';

describe('readSecret', () => {
  it('prefiere el archivo de <NAME>_FILE y recorta el salto de línea', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'secret-')), 'jwt_secret');
    writeFileSync(file, 'from-file\n');

    expect(readSecret('JWT_SECRET', { JWT_SECRET_FILE: file, JWT_SECRET: 'from-env' })).toBe(
      'from-file',
    );
  });

  it('usa la variable <NAME> si no hay archivo', () => {
    expect(readSecret('JWT_SECRET', { JWT_SECRET: 'from-env' })).toBe('from-env');
  });

  it('falla con un mensaje claro si no hay ninguno', () => {
    expect(() => readSecret('JWT_SECRET', {})).toThrow(/JWT_SECRET o JWT_SECRET_FILE/);
  });

  it('falla con un mensaje claro si el archivo no existe', () => {
    expect(() => readSecret('JWT_SECRET', { JWT_SECRET_FILE: '/no/existe' })).toThrow(
      /JWT_SECRET_FILE/,
    );
  });
});
