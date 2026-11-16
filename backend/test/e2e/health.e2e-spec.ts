import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../src/infrastructure/configure-app.js';
import { AppModule } from '../../src/infrastructure/modules/app.module.js';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health → 200', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  it('GET /api/health/live → 200', async () => {
    await request(app.getHttpServer()).get('/api/health/live').expect(200);
  });

  it('ruta inexistente → 404 con el formato de error del contrato', async () => {
    const res = await request(app.getHttpServer()).get('/api/nope').expect(404);
    expect(res.body).toEqual({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Recurso no encontrado',
    });
  });
});
