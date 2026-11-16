import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveDatabaseUrl } from './database-url.js';

const DB = { DB_HOST: 'db', DB_NAME: 'foilhub', DB_USER: 'foilhub' };

describe('resolveDatabaseUrl', () => {
  it('usa DATABASE_URL si existe', () => {
    expect(
      resolveDatabaseUrl({
        DATABASE_URL: 'postgresql://x',
        ...DB,
        DB_PASSWORD: 'p',
      }),
    ).toBe('postgresql://x');
  });

  it('arma la URL con DB_* y la contraseña de DB_PASSWORD_FILE (Swarm)', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'secret-')), 'db_password');
    writeFileSync(file, 'abc123\n');

    expect(resolveDatabaseUrl({ ...DB, DB_PASSWORD_FILE: file })).toBe(
      'postgresql://foilhub:abc123@db:5432/foilhub?schema=public',
    );
  });

  it('acepta DB_PASSWORD y DB_PORT, y codifica caracteres especiales', () => {
    expect(
      resolveDatabaseUrl({ ...DB, DB_PORT: '6543', DB_PASSWORD: 'p@ss/w:rd' }),
    ).toBe(
      'postgresql://foilhub:p%40ss%2Fw%3Ard@db:6543/foilhub?schema=public',
    );
  });

  it('falla con un mensaje claro si no hay configuración', () => {
    expect(() => resolveDatabaseUrl({})).toThrow(/DATABASE_URL, o DB_HOST/);
  });

  it('falla si falta la contraseña o algún DB_*', () => {
    expect(() => resolveDatabaseUrl(DB)).toThrow(
      /DB_PASSWORD o DB_PASSWORD_FILE/,
    );
    expect(() =>
      resolveDatabaseUrl({
        DB_HOST: 'db',
        DB_NAME: 'foilhub',
        DB_PASSWORD: 'p',
      }),
    ).toThrow(/DB_USER/);
  });
});
