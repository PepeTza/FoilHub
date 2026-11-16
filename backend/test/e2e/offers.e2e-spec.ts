import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp, type TestApp } from './test-app.js';
import { resetDb } from './test-db.js';

describe('Offers (e2e)', () => {
  let t: TestApp;
  let http: App;
  let ana: { id: string; token: string };
  let beto: { id: string; token: string };

  beforeAll(async () => {
    t = await createTestApp();
    http = t.app.getHttpServer() as App;
  });

  afterAll(async () => {
    await t.app.close();
  });

  beforeEach(async () => {
    await resetDb(t.prisma);
    await t.prisma.card.createMany({
      data: [
        { id: randomUUID(), code: 'BT1-010', name: 'Agumon', color: 'Red' },
        { id: randomUUID(), code: 'BT1-028', name: 'Gabumon', color: 'Blue' },
        { id: randomUUID(), code: 'BT1-047', name: 'Patamon', color: 'Yellow' },
      ],
    });
    ana = await signUp('ana');
    beto = await signUp('beto');
  });

  async function signUp(username: string) {
    const reg = await request(http)
      .post('/api/auth/register')
      .send({ username, password: 'secreta123' })
      .expect(201);
    const log = await request(http)
      .post('/api/auth/login')
      .send({ username, password: 'secreta123' })
      .expect(200);
    return { id: reg.body.id as string, token: log.body.accessToken as string };
  }

  const auth = (who: { token: string }) => ({
    Authorization: `Bearer ${who.token}`,
  });

  function createOffer(
    who: { token: string },
    give: [string, number] = ['BT1-010', 2],
    want: [string, number] = ['BT1-028', 1],
  ) {
    return request(http).post('/api/offers').set(auth(who)).send({
      offeredCardCode: give[0],
      offeredQuantity: give[1],
      wantedCardCode: want[0],
      wantedQuantity: want[1],
    });
  }

  describe('POST /api/offers', () => {
    it('201 con el OfferDto del contrato', async () => {
      const res = await createOffer(ana).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        owner: { id: ana.id, username: 'ana' },
        offered: {
          card: {
            code: 'BT1-010',
            name: 'Agumon',
            setName: null,
            rarity: null,
            color: 'Red',
            cardType: null,
            imageUrl: null,
          },
          quantity: 2,
        },
        wanted: {
          card: expect.objectContaining({ code: 'BT1-028' }),
          quantity: 1,
        },
        status: 'OPEN',
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
        closedAt: null,
      });
    });

    it('sin token → 401 UNAUTHORIZED', async () => {
      await request(http).post('/api/offers').send({}).expect(401);
    });

    it('carta inexistente → 404 CARD_NOT_FOUND', async () => {
      const res = await createOffer(ana, ['BT9-999', 1]).expect(404);
      expect(res.body.error).toBe('CARD_NOT_FOUND');
    });

    it('misma carta → 400 SAME_CARD_TRADE; cantidad fuera de rango → 400 INVALID_QUANTITY', async () => {
      expect(
        (await createOffer(ana, ['BT1-010', 1], ['BT1-010', 2]).expect(400))
          .body.error,
      ).toBe('SAME_CARD_TRADE');
      expect(
        (await createOffer(ana, ['BT1-010', 100]).expect(400)).body.error,
      ).toBe('INVALID_QUANTITY');
    });

    it('cantidad como texto → 400 VALIDATION_ERROR', async () => {
      const res = await request(http)
        .post('/api/offers')
        .set(auth(ana))
        .send({
          offeredCardCode: 'BT1-010',
          offeredQuantity: 'dos',
          wantedCardCode: 'BT1-028',
          wantedQuantity: 1,
        })
        .expect(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/offers', () => {
    it('anónimo ve todas las OPEN; con sesión no ve las propias; filtra por código', async () => {
      const a = (await createOffer(ana).expect(201)).body;
      const b = (
        await createOffer(beto, ['BT1-028', 1], ['BT1-010', 2]).expect(201)
      ).body;

      const anonymous = await request(http).get('/api/offers').expect(200);
      expect(anonymous.body).toMatchObject({ page: 1, pageSize: 20, total: 2 });

      const forAna = await request(http)
        .get('/api/offers')
        .set(auth(ana))
        .expect(200);
      expect(forAna.body.items.map((o: { id: string }) => o.id)).toEqual([
        b.id,
      ]);

      const filtered = await request(http)
        .get('/api/offers')
        .query({ offeredCardCode: 'bt1-010' })
        .expect(200);
      expect(filtered.body.items.map((o: { id: string }) => o.id)).toEqual([
        a.id,
      ]);
    });

    it('un token inválido no impide listar (se trata como anónimo)', async () => {
      await createOffer(ana).expect(201);
      const res = await request(http)
        .get('/api/offers')
        .set('Authorization', 'Bearer basura')
        .expect(200);
      expect(res.body.total).toBe(1);
    });

    it('page inválido → 400 VALIDATION_ERROR', async () => {
      const res = await request(http)
        .get('/api/offers')
        .query({ page: 0 })
        .expect(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/offers/mine', () => {
    it('lista las propias con filtro por estado', async () => {
      const open = (await createOffer(ana).expect(201)).body;
      const toCancel = (await createOffer(ana, ['BT1-047', 1]).expect(201))
        .body;
      await createOffer(beto, ['BT1-028', 1], ['BT1-010', 2]).expect(201);
      await request(http)
        .post(`/api/offers/${toCancel.id}/cancel`)
        .set(auth(ana))
        .expect(200);

      const all = await request(http)
        .get('/api/offers/mine')
        .set(auth(ana))
        .expect(200);
      expect(all.body).toHaveLength(2);

      const onlyOpen = await request(http)
        .get('/api/offers/mine')
        .query({ status: 'OPEN' })
        .set(auth(ana))
        .expect(200);
      expect(onlyOpen.body.map((o: { id: string }) => o.id)).toEqual([open.id]);
    });

    it('sin token → 401; estado inválido → 400 VALIDATION_ERROR', async () => {
      await request(http).get('/api/offers/mine').expect(401);
      const res = await request(http)
        .get('/api/offers/mine')
        .query({ status: 'NOPE' })
        .set(auth(ana))
        .expect(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/offers/:id', () => {
    it('detalle público', async () => {
      const created = (await createOffer(ana).expect(201)).body;
      const res = await request(http)
        .get(`/api/offers/${created.id}`)
        .expect(200);
      expect(res.body).toEqual(created);
    });

    it.each([randomUUID(), 'no-es-uuid'])(
      'id %s → 404 OFFER_NOT_FOUND',
      async (id) => {
        const res = await request(http).get(`/api/offers/${id}`).expect(404);
        expect(res.body.error).toBe('OFFER_NOT_FOUND');
      },
    );
  });

  describe('POST /api/offers/:id/cancel', () => {
    it('el dueño cancela y las propuestas PENDING quedan REJECTED', async () => {
      const created = (await createOffer(ana).expect(201)).body;
      const proposalId = randomUUID();
      await t.prisma.tradeProposal.create({
        data: {
          id: proposalId,
          offerId: created.id,
          proposerId: beto.id,
          status: 'PENDING',
          createdAt: new Date(),
        },
      });

      const res = await request(http)
        .post(`/api/offers/${created.id}/cancel`)
        .set(auth(ana))
        .expect(200);

      expect(res.body).toMatchObject({
        id: created.id,
        status: 'CANCELLED',
        closedAt: expect.any(String),
      });
      const proposal = await t.prisma.tradeProposal.findUniqueOrThrow({
        where: { id: proposalId },
      });
      expect(proposal.status).toBe('REJECTED');
      expect(proposal.respondedAt).not.toBeNull();
    });

    it('oferta ajena → 403 FORBIDDEN; cancelar dos veces → 409 OFFER_NOT_OPEN', async () => {
      const created = (await createOffer(ana).expect(201)).body;

      expect(
        (
          await request(http)
            .post(`/api/offers/${created.id}/cancel`)
            .set(auth(beto))
            .expect(403)
        ).body.error,
      ).toBe('FORBIDDEN');
      await request(http)
        .post(`/api/offers/${created.id}/cancel`)
        .set(auth(ana))
        .expect(200);
      expect(
        (
          await request(http)
            .post(`/api/offers/${created.id}/cancel`)
            .set(auth(ana))
            .expect(409)
        ).body.error,
      ).toBe('OFFER_NOT_OPEN');
    });
  });

  describe('GET /api/offers/:id/matches', () => {
    it('devuelve las ofertas inversas exactas de otros usuarios', async () => {
      const mine = (
        await createOffer(ana, ['BT1-010', 2], ['BT1-028', 1]).expect(201)
      ).body;
      const exact = (
        await createOffer(beto, ['BT1-028', 1], ['BT1-010', 2]).expect(201)
      ).body;
      await createOffer(beto, ['BT1-028', 3], ['BT1-010', 2]).expect(201); // cantidades distintas

      const res = await request(http)
        .get(`/api/offers/${mine.id}/matches`)
        .set(auth(ana))
        .expect(200);

      expect(res.body.map((o: { id: string }) => o.id)).toEqual([exact.id]);
      expect(res.body[0].owner).toEqual({ id: beto.id, username: 'beto' });
    });

    it('otro usuario → 403 FORBIDDEN', async () => {
      const mine = (await createOffer(ana).expect(201)).body;
      const res = await request(http)
        .get(`/api/offers/${mine.id}/matches`)
        .set(auth(beto))
        .expect(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });
});
