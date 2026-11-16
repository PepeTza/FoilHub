import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { resetDb } from './test-db.js';
import { createTestApp, type TestApp } from './test-app.js';

describe('Auth (e2e)', () => {
  let t: TestApp;
  let http: App;

  beforeAll(async () => {
    t = await createTestApp();
    http = t.app.getHttpServer() as App;
  });

  afterAll(async () => {
    await t.app.close();
  });

  beforeEach(async () => {
    await resetDb(t.prisma);
  });

  const register = (body: object) =>
    request(http).post('/api/auth/register').send(body);
  const login = (body: object) =>
    request(http).post('/api/auth/login').send(body);

  it('registro → login → me con el token', async () => {
    const reg = await register({
      username: 'Ana',
      password: 'secreta123',
      contactInfo: 'ana#1234',
    }).expect(201);
    expect(reg.body).toEqual({ id: expect.any(String), username: 'ana' });

    const log = await login({ username: 'ana', password: 'secreta123' }).expect(
      200,
    );
    expect(log.body).toEqual({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: reg.body.id, username: 'ana' },
    });

    const me = await request(http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${log.body.accessToken}`)
      .expect(200);
    expect(me.body).toEqual({
      id: reg.body.id,
      username: 'ana',
      contactInfo: 'ana#1234',
    });
  });

  it('registro duplicado (sin distinguir mayúsculas) → 409 USERNAME_TAKEN', async () => {
    await register({ username: 'ana', password: 'secreta123' }).expect(201);
    const res = await register({
      username: 'ANA',
      password: 'otra12345',
    }).expect(409);
    expect(res.body).toEqual({
      statusCode: 409,
      error: 'USERNAME_TAKEN',
      message: expect.any(String),
    });
  });

  it('contraseña débil → 400 WEAK_PASSWORD; username inválido → 400 INVALID_USERNAME', async () => {
    expect(
      (await register({ username: 'ana', password: 'corta' }).expect(400)).body
        .error,
    ).toBe('WEAK_PASSWORD');
    expect(
      (await register({ username: 'a b', password: 'secreta123' }).expect(400))
        .body.error,
    ).toBe('INVALID_USERNAME');
  });

  it.each([
    ['clave incorrecta', { username: 'ana', password: 'incorrecta' }],
    ['usuario inexistente', { username: 'beto', password: 'secreta123' }],
  ])(
    'login con %s → 401 INVALID_CREDENTIALS (mismo cuerpo)',
    async (_case, body) => {
      await register({ username: 'ana', password: 'secreta123' }).expect(201);
      const res = await login(body).expect(401);
      expect(res.body).toEqual({
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Usuario o contraseña incorrectos',
      });
    },
  );

  it('me sin token → 401 UNAUTHORIZED', async () => {
    const res = await request(http).get('/api/auth/me').expect(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('me con token vencido o falso → 401 UNAUTHORIZED', async () => {
    const reg = await register({
      username: 'ana',
      password: 'secreta123',
    }).expect(201);
    const expired = await t.app
      .get(JwtService)
      .signAsync({ sub: reg.body.id, username: 'ana' }, { expiresIn: -10 });

    for (const token of [expired, 'no-es-un-jwt']) {
      const res = await request(http)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
      expect(res.body.error).toBe('UNAUTHORIZED');
    }
  });

  it('body con campos extra → 400 VALIDATION_ERROR con la lista de campos', async () => {
    const res = await register({
      username: 'ana',
      password: 'secreta123',
      isAdmin: true,
    }).expect(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
    });
    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('isAdmin')]),
    );
  });

  it('body con tipos incorrectos → 400 VALIDATION_ERROR', async () => {
    const res = await login({ username: 123, password: ['x'] }).expect(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('la contraseña no aparece en ninguna respuesta y se guarda hasheada', async () => {
    const reg = await register({
      username: 'ana',
      password: 'secreta123',
    }).expect(201);
    const log = await login({ username: 'ana', password: 'secreta123' }).expect(
      200,
    );
    const me = await request(http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${log.body.accessToken}`);

    for (const res of [reg, log, me]) {
      expect(JSON.stringify(res.body)).not.toContain('secreta123');
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    }
    const row = await t.prisma.user.findUniqueOrThrow({
      where: { username: 'ana' },
    });
    expect(row.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });
});
