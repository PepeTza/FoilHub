import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestApp, type TestApp } from './test-app.js';
import { resetDb } from './test-db.js';

interface Session {
  id: string;
  token: string;
}

describe('Proposals (e2e)', () => {
  let t: TestApp;
  let http: App;
  let ana: Session;
  let beto: Session;
  let carla: Session;

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
        { id: randomUUID(), code: 'BT1-010', name: 'Agumon' },
        { id: randomUUID(), code: 'BT1-028', name: 'Gabumon' },
        { id: randomUUID(), code: 'BT1-047', name: 'Patamon' },
      ],
    });
    ana = await signUp('ana', 'ana#1234');
    beto = await signUp('beto', 'beto@mail.com');
    carla = await signUp('carla');
  });

  async function signUp(
    username: string,
    contactInfo?: string,
  ): Promise<Session> {
    const reg = await request(http)
      .post('/api/auth/register')
      .send({
        username,
        password: 'secreta123',
        ...(contactInfo ? { contactInfo } : {}),
      })
      .expect(201);
    const log = await request(http)
      .post('/api/auth/login')
      .send({ username, password: 'secreta123' })
      .expect(200);
    return { id: reg.body.id as string, token: log.body.accessToken as string };
  }

  const auth = (who: Session) => ({ Authorization: `Bearer ${who.token}` });

  async function offer(
    who: Session,
    give: [string, number],
    want: [string, number],
  ): Promise<string> {
    const res = await request(http)
      .post('/api/offers')
      .set(auth(who))
      .send({
        offeredCardCode: give[0],
        offeredQuantity: give[1],
        wantedCardCode: want[0],
        wantedQuantity: want[1],
      })
      .expect(201);
    return res.body.id as string;
  }

  const propose = (who: Session, offerId: string, body: object = {}) =>
    request(http)
      .post(`/api/offers/${offerId}/proposals`)
      .set(auth(who))
      .send(body);
  const act = (
    who: Session,
    proposalId: string,
    action: 'accept' | 'reject' | 'cancel',
  ) =>
    request(http).post(`/api/proposals/${proposalId}/${action}`).set(auth(who));

  /** ana da 2 Agumon por 1 Gabumon; beto tiene la inversa exacta. */
  async function anaAndBeto() {
    const anaOffer = await offer(ana, ['BT1-010', 2], ['BT1-028', 1]);
    const betoOffer = await offer(beto, ['BT1-028', 1], ['BT1-010', 2]);
    return { anaOffer, betoOffer };
  }

  describe('POST /api/offers/:id/proposals', () => {
    it('201 con el ProposalDto del contrato', async () => {
      const { anaOffer, betoOffer } = await anaAndBeto();

      const res = await propose(beto, anaOffer, {
        counterOfferId: betoOffer,
        message: '¿Trato?',
      }).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        offer: expect.objectContaining({
          id: anaOffer,
          owner: { id: ana.id, username: 'ana' },
          status: 'OPEN',
        }),
        proposer: { id: beto.id, username: 'beto' },
        counterOffer: expect.objectContaining({
          id: betoOffer,
          owner: { id: beto.id, username: 'beto' },
        }),
        message: '¿Trato?',
        status: 'PENDING',
        createdAt: expect.stringMatching(/Z$/),
        respondedAt: null,
        contacts: null,
      });
    });

    it('oferta propia → 422 SELF_TRADE; duplicada → 409 DUPLICATE_PROPOSAL', async () => {
      const { anaOffer } = await anaAndBeto();

      expect((await propose(ana, anaOffer).expect(422)).body.error).toBe(
        'SELF_TRADE',
      );
      await propose(beto, anaOffer).expect(201);
      expect((await propose(beto, anaOffer).expect(409)).body.error).toBe(
        'DUPLICATE_PROPOSAL',
      );
    });

    it('contraoferta que no hace match → 422 COUNTER_OFFER_NOT_MATCHING', async () => {
      const { anaOffer } = await anaAndBeto();
      const notMatching = await offer(beto, ['BT1-028', 3], ['BT1-010', 2]);

      for (const counterOfferId of [notMatching, randomUUID(), 'no-es-uuid']) {
        const res = await propose(beto, anaOffer, { counterOfferId }).expect(
          422,
        );
        expect(res.body.error).toBe('COUNTER_OFFER_NOT_MATCHING');
      }
    });

    it('sin token → 401; oferta inexistente → 404; mensaje > 280 → 400 VALIDATION_ERROR', async () => {
      const { anaOffer } = await anaAndBeto();

      await request(http)
        .post(`/api/offers/${anaOffer}/proposals`)
        .send({})
        .expect(401);
      expect((await propose(beto, randomUUID()).expect(404)).body.error).toBe(
        'OFFER_NOT_FOUND',
      );
      expect(
        (
          await propose(beto, anaOffer, { message: 'x'.repeat(281) }).expect(
            400,
          )
        ).body.error,
      ).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/proposals', () => {
    it('received (por defecto) y sent, con filtro de estado', async () => {
      const { anaOffer } = await anaAndBeto();
      const p1 = (await propose(beto, anaOffer).expect(201)).body.id as string;
      const p2 = (await propose(carla, anaOffer).expect(201)).body.id as string;
      await act(ana, p2, 'reject').expect(200);

      const received = await request(http)
        .get('/api/proposals')
        .set(auth(ana))
        .expect(200);
      expect(received.body.map((p: { id: string }) => p.id).sort()).toEqual(
        [p1, p2].sort(),
      );

      const pending = await request(http)
        .get('/api/proposals')
        .query({ box: 'received', status: 'PENDING' })
        .set(auth(ana))
        .expect(200);
      expect(pending.body.map((p: { id: string }) => p.id)).toEqual([p1]);

      const sent = await request(http)
        .get('/api/proposals')
        .query({ box: 'sent' })
        .set(auth(beto))
        .expect(200);
      expect(sent.body.map((p: { id: string }) => p.id)).toEqual([p1]);
    });

    it('box inválido → 400 VALIDATION_ERROR; sin token → 401', async () => {
      expect(
        (
          await request(http)
            .get('/api/proposals')
            .query({ box: 'all' })
            .set(auth(ana))
            .expect(400)
        ).body.error,
      ).toBe('VALIDATION_ERROR');
      await request(http).get('/api/proposals').expect(401);
    });
  });

  describe('POST /api/proposals/:id/accept', () => {
    it('completa oferta y contraoferta, rechaza las demás y devuelve los contactos', async () => {
      const { anaOffer, betoOffer } = await anaAndBeto();
      const accepted = (
        await propose(beto, anaOffer, { counterOfferId: betoOffer }).expect(201)
      ).body.id;
      const other = (await propose(carla, anaOffer).expect(201)).body
        .id as string;

      const res = await act(ana, accepted, 'accept').expect(200);

      expect(res.body).toMatchObject({
        status: 'ACCEPTED',
        respondedAt: expect.any(String),
        offer: { status: 'COMPLETED' },
        counterOffer: { status: 'COMPLETED' },
        contacts: { offerOwner: 'ana#1234', proposer: 'beto@mail.com' },
      });
      expect(
        (
          await t.prisma.tradeProposal.findUniqueOrThrow({
            where: { id: other },
          })
        ).status,
      ).toBe('REJECTED');

      // Los dos ven los contactos; carla (rechazada) no.
      const betoSent = await request(http)
        .get('/api/proposals')
        .query({ box: 'sent' })
        .set(auth(beto))
        .expect(200);
      expect(betoSent.body[0].contacts).toEqual({
        offerOwner: 'ana#1234',
        proposer: 'beto@mail.com',
      });
      const carlaSent = await request(http)
        .get('/api/proposals')
        .query({ box: 'sent' })
        .set(auth(carla))
        .expect(200);
      expect(carlaSent.body[0]).toMatchObject({
        status: 'REJECTED',
        contacts: null,
      });
    });

    it('aceptar una propuesta ajena → 403 FORBIDDEN; inexistente → 404 PROPOSAL_NOT_FOUND', async () => {
      const { anaOffer } = await anaAndBeto();
      const p = (await propose(beto, anaOffer).expect(201)).body.id as string;

      expect((await act(beto, p, 'accept').expect(403)).body.error).toBe(
        'FORBIDDEN',
      );
      expect(
        (await act(ana, randomUUID(), 'accept').expect(404)).body.error,
      ).toBe('PROPOSAL_NOT_FOUND');
    });

    it('concurrencia: dos accept simultáneos sobre la misma oferta → uno 200 y el otro 409', async () => {
      const { anaOffer } = await anaAndBeto();
      const p1 = (await propose(beto, anaOffer).expect(201)).body.id as string;
      const p2 = (await propose(carla, anaOffer).expect(201)).body.id as string;

      const results = await Promise.all([
        act(ana, p1, 'accept'),
        act(ana, p2, 'accept'),
      ]);

      expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        200, 409,
      ]);
      const conflict = results.find((r) => r.status === 409)!;
      expect([
        'CONCURRENCY_CONFLICT',
        'OFFER_NOT_OPEN',
        'PROPOSAL_NOT_PENDING',
      ]).toContain(conflict.body.error);
      // Estado final consistente: la oferta COMPLETED y exactamente una propuesta ACCEPTED.
      const rows = await t.prisma.tradeProposal.findMany({
        where: { offerId: anaOffer },
      });
      expect(rows.map((r) => r.status).sort()).toEqual([
        'ACCEPTED',
        'REJECTED',
      ]);
      expect(
        (
          await t.prisma.tradeOffer.findUniqueOrThrow({
            where: { id: anaOffer },
          })
        ).status,
      ).toBe('COMPLETED');
    });
  });

  describe('POST /api/proposals/:id/reject y /cancel', () => {
    it('el dueño rechaza; el proponente no puede rechazar (403)', async () => {
      const { anaOffer } = await anaAndBeto();
      const p = (await propose(beto, anaOffer).expect(201)).body.id as string;

      expect((await act(beto, p, 'reject').expect(403)).body.error).toBe(
        'FORBIDDEN',
      );
      const res = await act(ana, p, 'reject').expect(200);
      expect(res.body).toMatchObject({
        status: 'REJECTED',
        contacts: null,
        offer: { status: 'OPEN' },
      });
    });

    it('solo el proponente cancela (403 para el dueño); cancelar dos veces → 409', async () => {
      const { anaOffer } = await anaAndBeto();
      const p = (await propose(beto, anaOffer).expect(201)).body.id as string;

      expect((await act(ana, p, 'cancel').expect(403)).body.error).toBe(
        'FORBIDDEN',
      );
      expect((await act(beto, p, 'cancel').expect(200)).body.status).toBe(
        'CANCELLED',
      );
      expect((await act(beto, p, 'cancel').expect(409)).body.error).toBe(
        'PROPOSAL_NOT_PENDING',
      );
    });
  });
});
