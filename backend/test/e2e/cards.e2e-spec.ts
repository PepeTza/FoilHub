import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ImportCardCatalogUseCase } from '../../src/application/use-cases/cards/import-card-catalog.use-case.js';
import { createTestApp, type TestApp } from './test-app.js';
import { resetDb } from './test-db.js';

describe('Cards (e2e)', () => {
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

  it('importa el catálogo desde JSON sin duplicar al ejecutar dos veces', async () => {
    const importCatalog = t.app.get(ImportCardCatalogUseCase);

    const first = await importCatalog.execute();
    const second = await importCatalog.execute();

    expect(first.imported).toBeGreaterThanOrEqual(40);
    expect(first.skipped).toBe(0);
    expect(second).toEqual(first);

    const count = await t.prisma.card.count();
    expect(count).toBe(first.imported);
  });

  it('GET /api/cards busca paginado y limita pageSize a 50', async () => {
    await t.app.get(ImportCardCatalogUseCase).execute();

    const searchRes = await request(http)
      .get('/api/cards')
      .query({ search: 'agu', page: 1, pageSize: 10 })
      .expect(200);

    expect(searchRes.body.page).toBe(1);
    expect(searchRes.body.pageSize).toBe(10);
    expect(searchRes.body.total).toBeGreaterThanOrEqual(2);
    expect(searchRes.body.items[0]).toEqual({
      code: expect.any(String),
      name: expect.stringMatching(/agu/i),
      setName: expect.any(String),
      rarity: expect.any(String),
      color: expect.any(String),
      cardType: expect.any(String),
      imageUrl: expect.any(String),
    });

    const cappedRes = await request(http)
      .get('/api/cards')
      .query({ pageSize: 100 })
      .expect(200);

    expect(cappedRes.body.pageSize).toBe(50);
  });

  it('GET /api/cards/:code devuelve CardDto o 404 CARD_NOT_FOUND', async () => {
    await t.app.get(ImportCardCatalogUseCase).execute();

    const found = await request(http).get('/api/cards/bt1-084').expect(200);
    expect(found.body).toEqual({
      code: 'BT1-084',
      name: 'Omnimon',
      setName: 'Release Special Booster Ver.1.0 [BT01-03]',
      rarity: 'SR',
      color: 'White',
      cardType: 'Digimon',
      imageUrl: 'https://images.digimoncard.io/images/cards/BT1-084.jpg',
    });

    const missing = await request(http).get('/api/cards/BT9-999').expect(404);
    expect(missing.body).toEqual({
      statusCode: 404,
      error: 'CARD_NOT_FOUND',
      message: expect.any(String),
    });
  });
});
