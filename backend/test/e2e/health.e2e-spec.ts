import request from 'supertest';
import { createTestApp, type TestApp } from './test-app.js';

describe('Health (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('GET /api/health → 200 con la base de datos arriba', async () => {
    const res = await request(t.app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' } },
    });
  });

  it('GET /api/health/live → 200 sin consultar la BD', async () => {
    const res = await request(t.app.getHttpServer())
      .get('/api/health/live')
      .expect(200);
    expect(res.body).toMatchObject({ status: 'ok', info: {} });
  });

  it('ruta inexistente → 404 con el formato de error del contrato', async () => {
    const res = await request(t.app.getHttpServer())
      .get('/api/nope')
      .expect(404);
    expect(res.body).toEqual({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Recurso no encontrado',
    });
  });
});
