import { randomUUID } from 'node:crypto';
import { TradeOffer } from '../../src/domain/entities/trade-offer.entity.js';
import { TradeProposal } from '../../src/domain/entities/trade-proposal.entity.js';
import { User } from '../../src/domain/entities/user.entity.js';
import {
  ConcurrencyConflictError,
  DuplicateProposalError,
  UsernameTakenError,
} from '../../src/domain/errors/domain-errors.js';
import { Quantity } from '../../src/domain/value-objects/quantity.vo.js';
import { Username } from '../../src/domain/value-objects/username.vo.js';
import type { PrismaService } from '../../src/infrastructure/prisma/prisma.service.js';
import { TradeOfferMapper } from '../../src/interface-adapters/persistence/mappers/trade-offer.mapper.js';
import { PrismaTradeOfferRepository } from '../../src/interface-adapters/persistence/repositories/prisma-trade-offer.repository.js';
import { PrismaTradeProposalRepository } from '../../src/interface-adapters/persistence/repositories/prisma-trade-proposal.repository.js';
import { PrismaUnitOfWork } from '../../src/interface-adapters/persistence/repositories/prisma-unit-of-work.js';
import { PrismaUserRepository } from '../../src/interface-adapters/persistence/repositories/prisma-user.repository.js';
import { connectTestDb, resetDb } from '../e2e/test-db.js';

const T0 = new Date('2026-01-01T00:00:00.000Z');
const T1 = new Date('2026-01-02T00:00:00.000Z');

let prisma: PrismaService;
let users: PrismaUserRepository;
let offers: PrismaTradeOfferRepository;
let proposals: PrismaTradeProposalRepository;

// Datos base: ana y beto; cartas agumon, gabumon, patamon.
const ana = randomUUID();
const beto = randomUUID();
const agumon = randomUUID();
const gabumon = randomUUID();
const patamon = randomUUID();

function newUser(id: string, username: string): User {
  return User.create({
    id,
    username: Username.create(username),
    passwordHash: 'hash',
    contactInfo: null,
    createdAt: T0,
  });
}

function newOffer(
  ownerId: string,
  give: [string, number],
  want: [string, number],
  createdAt = T0,
): TradeOffer {
  return TradeOffer.create({
    id: randomUUID(),
    ownerId,
    offeredCardId: give[0],
    offeredQuantity: Quantity.create(give[1]),
    wantedCardId: want[0],
    wantedQuantity: Quantity.create(want[1]),
    createdAt,
  });
}

function newProposal(
  offer: TradeOffer,
  proposerId: string,
  counterOffer: TradeOffer | null = null,
) {
  return TradeProposal.create({
    id: randomUUID(),
    offer,
    proposerId,
    counterOffer,
    message: 'hola',
    createdAt: T0,
  });
}

beforeAll(async () => {
  prisma = await connectTestDb();
  users = new PrismaUserRepository(prisma);
  offers = new PrismaTradeOfferRepository(prisma);
  proposals = new PrismaTradeProposalRepository(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb(prisma);
  await users.save(newUser(ana, 'ana'));
  await users.save(newUser(beto, 'beto'));
  await prisma.card.createMany({
    data: [
      { id: agumon, code: 'BT1-010', name: 'Agumon' },
      { id: gabumon, code: 'BT1-028', name: 'Gabumon' },
      { id: patamon, code: 'BT1-047', name: 'Patamon' },
    ],
  });
});

describe('PrismaUserRepository', () => {
  it('guarda y lee por id, ids y username', async () => {
    const byId = await users.findById(ana);
    expect(byId?.username.value).toBe('ana');
    expect(byId?.createdAt).toEqual(T0);
    expect((await users.findByUsername(Username.create('BETO')))?.id).toBe(
      beto,
    );
    expect(
      (await users.findByIds([ana, beto])).map((u) => u.id).sort(),
    ).toEqual([ana, beto].sort());
    expect(await users.findById(randomUUID())).toBeNull();
  });

  it('un username repetido con otro id → UsernameTakenError (índice único)', async () => {
    await expect(users.save(newUser(randomUUID(), 'ana'))).rejects.toThrow(
      UsernameTakenError,
    );
  });
});

describe('PrismaTradeOfferRepository', () => {
  it('guarda y lee una oferta', async () => {
    const offer = newOffer(ana, [agumon, 2], [gabumon, 1]);
    await offers.save(offer);

    const stored = await offers.findById(offer.id);
    expect(stored).toMatchObject({
      id: offer.id,
      ownerId: ana,
      offeredCardId: agumon,
      wantedCardId: gabumon,
      status: 'OPEN',
    });
    expect(stored?.offeredQuantity.value).toBe(2);
    expect(stored?.closedAt).toBeNull();
  });

  it('listOpen filtra por cartas, excluye al dueño y pagina', async () => {
    const a1 = newOffer(ana, [agumon, 1], [gabumon, 1], T0);
    const a2 = newOffer(ana, [agumon, 1], [patamon, 1], T1);
    const b1 = newOffer(beto, [gabumon, 1], [agumon, 1], T0);
    const cancelled = newOffer(beto, [agumon, 1], [gabumon, 1], T0);
    cancelled.cancel(beto, T1);
    for (const o of [a1, a2, b1]) await offers.save(o);
    await offers.save(newOffer(beto, [patamon, 1], [gabumon, 1]));
    await prisma.tradeOffer.create({
      data: TradeOfferMapper.toPersistence(cancelled),
    });

    const all = await offers.listOpen({ page: 1, pageSize: 10 });
    expect(all.total).toBe(4);

    const offeringAgumon = await offers.listOpen({
      offeredCardId: agumon,
      page: 1,
      pageSize: 10,
    });
    expect(offeringAgumon.items.map((o) => o.id)).toEqual([a2.id, a1.id]); // más nuevas primero

    const wantingAgumon = await offers.listOpen({
      wantedCardId: agumon,
      page: 1,
      pageSize: 10,
    });
    expect(wantingAgumon.items.map((o) => o.id)).toEqual([b1.id]);

    const notAna = await offers.listOpen({
      excludeOwnerId: ana,
      page: 1,
      pageSize: 10,
    });
    expect(notAna.items.every((o) => o.ownerId === beto)).toBe(true);

    const page2 = await offers.listOpen({ page: 2, pageSize: 3 });
    expect(page2).toMatchObject({ page: 2, pageSize: 3, total: 4 });
    expect(page2.items).toHaveLength(1);
  });

  it('listByOwner filtra por estado', async () => {
    const open = newOffer(ana, [agumon, 1], [gabumon, 1]);
    const toCancel = newOffer(ana, [agumon, 1], [patamon, 1]);
    await offers.save(open);
    await offers.save(toCancel);
    toCancel.cancel(ana, T1);
    await offers.save(toCancel);

    expect(await offers.listByOwner(ana)).toHaveLength(2);
    expect((await offers.listByOwner(ana, 'OPEN')).map((o) => o.id)).toEqual([
      open.id,
    ]);
    expect((await offers.listByOwner(ana, 'CANCELLED'))[0]?.closedAt).toEqual(
      T1,
    );
  });

  it('findMatchCandidates trae ofertas abiertas de otros con las cartas invertidas', async () => {
    const mine = newOffer(ana, [agumon, 2], [gabumon, 1]);
    const inverse = newOffer(beto, [gabumon, 1], [agumon, 2]);
    const inverseOtherQty = newOffer(beto, [gabumon, 5], [agumon, 5]); // candidato; TradeMatcher decide
    const notInverse = newOffer(beto, [patamon, 1], [agumon, 2]);
    const myOwnInverse = newOffer(ana, [gabumon, 1], [agumon, 2]);
    for (const o of [mine, inverse, inverseOtherQty, notInverse, myOwnInverse])
      await offers.save(o);

    const ids = (await offers.findMatchCandidates(mine))
      .map((o) => o.id)
      .sort();
    expect(ids).toEqual([inverse.id, inverseOtherQty.id].sort());
  });

  it('cerrar una oferta que otro ya cerró → ConcurrencyConflictError', async () => {
    const offer = newOffer(ana, [agumon, 1], [gabumon, 1]);
    await offers.save(offer);
    const first = (await offers.findById(offer.id))!;
    const second = (await offers.findById(offer.id))!;

    first.complete(T1);
    await offers.save(first);
    second.cancel(ana, T1);

    await expect(offers.save(second)).rejects.toThrow(ConcurrencyConflictError);
    expect((await offers.findById(offer.id))?.status).toBe('COMPLETED');
  });
});

describe('PrismaTradeProposalRepository', () => {
  it('guarda, lee y lista enviadas/recibidas', async () => {
    const offer = newOffer(ana, [agumon, 2], [gabumon, 1]);
    const counter = newOffer(beto, [gabumon, 1], [agumon, 2]);
    await offers.save(offer);
    await offers.save(counter);
    const p = newProposal(offer, beto, counter);
    await proposals.save(p);

    expect(await proposals.findById(p.id)).toMatchObject({
      offerId: offer.id,
      proposerId: beto,
      counterOfferId: counter.id,
      message: 'hola',
      status: 'PENDING',
    });
    expect(await proposals.existsPending(offer.id, beto)).toBe(true);
    expect(await proposals.existsPending(offer.id, ana)).toBe(false);
    expect(
      (await proposals.findPendingByOffer(offer.id)).map((x) => x.id),
    ).toEqual([p.id]);
    expect(
      (await proposals.listForUser({ userId: beto, box: 'sent' })).map(
        (x) => x.id,
      ),
    ).toEqual([p.id]);
    expect(
      (await proposals.listForUser({ userId: ana, box: 'received' })).map(
        (x) => x.id,
      ),
    ).toEqual([p.id]);
    expect(await proposals.listForUser({ userId: ana, box: 'sent' })).toEqual(
      [],
    );
    expect(
      await proposals.listForUser({
        userId: ana,
        box: 'received',
        status: 'ACCEPTED',
      }),
    ).toEqual([]);
  });

  it('saveMany actualiza varias propuestas', async () => {
    const offer = newOffer(ana, [agumon, 1], [gabumon, 1]);
    await offers.save(offer);
    const p = newProposal(offer, beto);
    await proposals.save(p);
    p.autoReject(T1);
    await proposals.saveMany([p]);

    expect(await proposals.findById(p.id)).toMatchObject({
      status: 'REJECTED',
      respondedAt: T1,
    });
    expect(await proposals.findPendingByOffer(offer.id)).toEqual([]);
  });

  it('el índice parcial impide dos PENDING del mismo usuario sobre la misma oferta', async () => {
    const offer = newOffer(ana, [agumon, 1], [gabumon, 1]);
    await offers.save(offer);
    const row = {
      offerId: offer.id,
      proposerId: beto,
      status: 'PENDING' as const,
      createdAt: T0,
    };

    await prisma.tradeProposal.create({ data: { id: randomUUID(), ...row } });
    // Insertado "a mano", sin pasar por el repositorio:
    await expect(
      prisma.tradeProposal.create({ data: { id: randomUUID(), ...row } }),
    ).rejects.toMatchObject({
      code: 'P2002',
    });
    // A través del repositorio se traduce a error de dominio:
    await expect(proposals.save(newProposal(offer, beto))).rejects.toThrow(
      DuplicateProposalError,
    );
    // Una propuesta ya no PENDING no cuenta para el índice:
    await prisma.tradeProposal.create({
      data: { id: randomUUID(), ...row, status: 'REJECTED' },
    });
  });
});

describe('PrismaUnitOfWork', () => {
  it('confirma los cambios si el trabajo termina bien', async () => {
    const offer = newOffer(ana, [agumon, 1], [gabumon, 1]);
    await offers.save(offer);
    const p = newProposal(offer, beto);
    await proposals.save(p);

    await new PrismaUnitOfWork(prisma).run(async (repos) => {
      const o = (await repos.offers.findById(offer.id))!;
      o.cancel(ana, T1);
      await repos.offers.save(o);
      const pending = await repos.proposals.findPendingByOffer(offer.id);
      pending.forEach((x) => x.autoReject(T1));
      await repos.proposals.saveMany(pending);
    });

    expect((await offers.findById(offer.id))?.status).toBe('CANCELLED');
    expect((await proposals.findById(p.id))?.status).toBe('REJECTED');
  });

  it('hace rollback si el trabajo lanza', async () => {
    const offer = newOffer(ana, [agumon, 1], [gabumon, 1]);
    await offers.save(offer);

    await expect(
      new PrismaUnitOfWork(prisma).run(async (repos) => {
        const o = (await repos.offers.findById(offer.id))!;
        o.cancel(ana, T1);
        await repos.offers.save(o);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect((await offers.findById(offer.id))?.status).toBe('OPEN');
  });
});
