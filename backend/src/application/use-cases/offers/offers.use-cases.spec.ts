import {
  FixedClock,
  InMemoryCardRepository,
  InMemoryTradeOfferRepository,
  InMemoryTradeProposalRepository,
  InMemoryUnitOfWork,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '../../../../test/fakes/index.js';
import { Card } from '../../../domain/entities/card.entity.js';
import { TradeProposal } from '../../../domain/entities/trade-proposal.entity.js';
import { User } from '../../../domain/entities/user.entity.js';
import {
  CardNotFoundError,
  InvalidCardCodeError,
  InvalidQuantityError,
  NotOfferOwnerError,
  OfferNotFoundError,
  OfferNotOpenError,
  SameCardTradeError,
} from '../../../domain/errors/domain-errors.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import { Username } from '../../../domain/value-objects/username.vo.js';
import { CancelTradeOfferUseCase } from './cancel-trade-offer.use-case.js';
import { CreateTradeOfferUseCase } from './create-trade-offer.use-case.js';
import { FindMatchesForOfferUseCase } from './find-matches-for-offer.use-case.js';
import { GetOfferUseCase } from './get-offer.use-case.js';
import { ListMyOffersUseCase } from './list-my-offers.use-case.js';
import { ListOpenOffersUseCase } from './list-open-offers.use-case.js';
import { OfferViewAssembler } from './offer-view.js';

const card = (id: string, code: string, name: string) =>
  Card.create({
    id,
    code: CardCode.create(code),
    name,
    setName: 'BT1',
    rarity: 'C',
    color: 'Red',
    cardType: 'Digimon',
    imageUrl: null,
  });

const user = (id: string, username: string) =>
  User.create({
    id,
    username: Username.create(username),
    passwordHash: 'h',
    contactInfo: null,
    createdAt: new Date(0),
  });

function setup() {
  const cards = new InMemoryCardRepository().seed(
    card('agumon', 'BT1-010', 'Agumon'),
    card('gabumon', 'BT1-028', 'Gabumon'),
    card('patamon', 'BT1-047', 'Patamon'),
  );
  const users = new InMemoryUserRepository().seed(
    user('ana', 'ana'),
    user('beto', 'beto'),
    user('carla', 'carla'),
  );
  const offers = new InMemoryTradeOfferRepository();
  const proposals = new InMemoryTradeProposalRepository(offers);
  const uow = new InMemoryUnitOfWork(offers, proposals);
  const clock = new FixedClock(new Date('2026-03-01T10:00:00Z'));
  const views = new OfferViewAssembler(cards, users);

  const create = new CreateTradeOfferUseCase(
    offers,
    cards,
    new SequentialIdGenerator('offer'),
    clock,
    views,
  );
  return {
    cards,
    users,
    offers,
    proposals,
    clock,
    views,
    create,
    listOpen: new ListOpenOffersUseCase(offers, cards, views),
    listMine: new ListMyOffersUseCase(offers, views),
    get: new GetOfferUseCase(offers, views),
    cancel: new CancelTradeOfferUseCase(uow, clock, views),
    matches: new FindMatchesForOfferUseCase(offers, views),
    /** ana da 2 Agumon, quiere 1 Gabumon (por defecto). */
    offer: (
      ownerId = 'ana',
      give: [string, number] = ['BT1-010', 2],
      want: [string, number] = ['BT1-028', 1],
    ) =>
      create.execute({
        ownerId,
        offeredCardCode: give[0],
        offeredQuantity: give[1],
        wantedCardCode: want[0],
        wantedQuantity: want[1],
      }),
  };
}

describe('CreateTradeOfferUseCase', () => {
  it('crea una oferta OPEN y devuelve cartas y dueño', async () => {
    const { offer, clock } = setup();

    const view = await offer('ana', [' bt1-010 ', 2], ['BT1-028', 1]);

    expect(view).toEqual({
      id: 'offer-1',
      owner: { id: 'ana', username: 'ana' },
      offered: {
        card: expect.objectContaining({ code: 'BT1-010', name: 'Agumon' }),
        quantity: 2,
      },
      wanted: {
        card: expect.objectContaining({ code: 'BT1-028', name: 'Gabumon' }),
        quantity: 1,
      },
      status: 'OPEN',
      createdAt: clock.now(),
      closedAt: null,
    });
  });

  it('carta inexistente → CARD_NOT_FOUND', async () => {
    await expect(
      setup().offer('ana', ['BT9-999', 1], ['BT1-028', 1]),
    ).rejects.toThrow(CardNotFoundError);
  });

  it('código con formato inválido → INVALID_CARD_CODE', async () => {
    await expect(
      setup().offer('ana', ['no-es-codigo', 1], ['BT1-028', 1]),
    ).rejects.toThrow(InvalidCardCodeError);
  });

  it('misma carta en los dos lados → SAME_CARD_TRADE', async () => {
    await expect(
      setup().offer('ana', ['BT1-010', 1], ['bt1-010', 3]),
    ).rejects.toThrow(SameCardTradeError);
  });

  it.each([0, 100, 1.5])('cantidad %d → INVALID_QUANTITY', async (quantity) => {
    await expect(
      setup().offer('ana', ['BT1-010', quantity], ['BT1-028', 1]),
    ).rejects.toThrow(InvalidQuantityError);
  });

  it('no guarda nada si falla', async () => {
    const { offer, offers } = setup();
    await offer('ana', ['BT9-999', 1], ['BT1-028', 1]).catch(() => undefined);

    expect(await offers.listByOwner('ana')).toEqual([]);
  });
});

describe('ListOpenOffersUseCase', () => {
  it('lista solo ofertas OPEN, más nuevas primero, y excluye las del usuario autenticado', async () => {
    const ctx = setup();
    const a = await ctx.offer('ana');
    ctx.clock.advance(1000);
    const b = await ctx.offer('beto', ['BT1-028', 1], ['BT1-010', 2]);
    ctx.clock.advance(1000);
    const c = await ctx.offer('carla', ['BT1-047', 1], ['BT1-010', 1]);
    await ctx.cancel.execute({ offerId: c.id, userId: 'carla' });

    const anonymous = await ctx.listOpen.execute({});
    expect(anonymous.items.map((o) => o.id)).toEqual([b.id, a.id]);
    expect(anonymous.total).toBe(2);

    const forAna = await ctx.listOpen.execute({ viewerId: 'ana' });
    expect(forAna.items.map((o) => o.id)).toEqual([b.id]);
  });

  it('filtra por carta ofrecida o buscada (por código)', async () => {
    const ctx = setup();
    const a = await ctx.offer('ana');
    const b = await ctx.offer('beto', ['BT1-028', 1], ['BT1-010', 2]);

    expect(
      (await ctx.listOpen.execute({ offeredCardCode: 'bt1-010' })).items.map(
        (o) => o.id,
      ),
    ).toEqual([a.id]);
    expect(
      (await ctx.listOpen.execute({ wantedCardCode: 'BT1-010' })).items.map(
        (o) => o.id,
      ),
    ).toEqual([b.id]);
  });

  it('un filtro con carta inexistente o código inválido devuelve una página vacía', async () => {
    const ctx = setup();
    await ctx.offer('ana');

    for (const offeredCardCode of ['BT9-999', 'basura']) {
      expect(
        await ctx.listOpen.execute({ offeredCardCode, page: 2, pageSize: 5 }),
      ).toEqual({
        items: [],
        page: 2,
        pageSize: 5,
        total: 0,
      });
    }
  });

  it('pagina y limita pageSize a 50', async () => {
    const ctx = setup();
    for (let i = 0; i < 3; i++) await ctx.offer('ana');

    const page2 = await ctx.listOpen.execute({ page: 2, pageSize: 2 });
    expect(page2).toMatchObject({ page: 2, pageSize: 2, total: 3 });
    expect(page2.items).toHaveLength(1);
    expect((await ctx.listOpen.execute({ pageSize: 500 })).pageSize).toBe(50);
  });

  it('carga cartas y dueños en lote (sin N+1)', async () => {
    const ctx = setup();
    for (let i = 0; i < 5; i++) await ctx.offer(i % 2 ? 'ana' : 'beto');
    const cardsByIds = vi.spyOn(ctx.cards, 'findByIds');
    const usersByIds = vi.spyOn(ctx.users, 'findByIds');
    const cardById = vi.spyOn(ctx.cards, 'findById');
    const userById = vi.spyOn(ctx.users, 'findById');

    const page = await ctx.listOpen.execute({});

    expect(page.items).toHaveLength(5);
    expect(cardsByIds).toHaveBeenCalledTimes(1);
    expect(cardsByIds).toHaveBeenCalledWith(['agumon', 'gabumon']);
    expect(usersByIds).toHaveBeenCalledTimes(1);
    expect(cardById).not.toHaveBeenCalled();
    expect(userById).not.toHaveBeenCalled();
  });
});

describe('ListMyOffersUseCase y GetOfferUseCase', () => {
  it('lista las ofertas propias, con filtro por estado', async () => {
    const ctx = setup();
    const open = await ctx.offer('ana');
    const cancelled = await ctx.offer('ana', ['BT1-047', 1], ['BT1-028', 1]);
    await ctx.offer('beto', ['BT1-028', 1], ['BT1-010', 2]);
    await ctx.cancel.execute({ offerId: cancelled.id, userId: 'ana' });

    expect(
      (await ctx.listMine.execute({ ownerId: 'ana' })).map((o) => o.id).sort(),
    ).toEqual([open.id, cancelled.id].sort());
    expect(
      (await ctx.listMine.execute({ ownerId: 'ana', status: 'OPEN' })).map(
        (o) => o.id,
      ),
    ).toEqual([open.id]);
    expect(await ctx.listMine.execute({ ownerId: 'carla' })).toEqual([]);
  });

  it('detalle de una oferta; inexistente → OFFER_NOT_FOUND', async () => {
    const ctx = setup();
    const created = await ctx.offer('ana');

    expect(await ctx.get.execute({ offerId: created.id })).toEqual(created);
    await expect(ctx.get.execute({ offerId: 'nope' })).rejects.toThrow(
      OfferNotFoundError,
    );
  });
});

describe('CancelTradeOfferUseCase', () => {
  it('el dueño cancela y las propuestas PENDING quedan REJECTED', async () => {
    const ctx = setup();
    const created = await ctx.offer('ana');
    const offer = (await ctx.offers.findById(created.id))!;
    const now = ctx.clock.now();
    const pending = TradeProposal.create({
      id: 'p1',
      offer,
      proposerId: 'beto',
      counterOffer: null,
      message: null,
      createdAt: now,
    });
    const alreadyCancelled = TradeProposal.create({
      id: 'p2',
      offer,
      proposerId: 'carla',
      counterOffer: null,
      message: null,
      createdAt: now,
    });
    alreadyCancelled.cancel('carla', now);
    await ctx.proposals.saveMany([pending, alreadyCancelled]);
    ctx.clock.advance(60_000);

    const view = await ctx.cancel.execute({
      offerId: created.id,
      userId: 'ana',
    });

    expect(view.status).toBe('CANCELLED');
    expect(view.closedAt).toEqual(ctx.clock.now());
    expect(await ctx.proposals.findById('p1')).toMatchObject({
      status: 'REJECTED',
      respondedAt: ctx.clock.now(),
    });
    expect((await ctx.proposals.findById('p2'))?.status).toBe('CANCELLED');
  });

  it('oferta ajena → FORBIDDEN y no cambia nada', async () => {
    const ctx = setup();
    const created = await ctx.offer('ana');

    await expect(
      ctx.cancel.execute({ offerId: created.id, userId: 'beto' }),
    ).rejects.toThrow(NotOfferOwnerError);
    expect((await ctx.offers.findById(created.id))?.status).toBe('OPEN');
  });

  it('cancelar dos veces → OFFER_NOT_OPEN', async () => {
    const ctx = setup();
    const created = await ctx.offer('ana');
    await ctx.cancel.execute({ offerId: created.id, userId: 'ana' });

    await expect(
      ctx.cancel.execute({ offerId: created.id, userId: 'ana' }),
    ).rejects.toThrow(OfferNotOpenError);
  });

  it('oferta inexistente → OFFER_NOT_FOUND', async () => {
    await expect(
      setup().cancel.execute({ offerId: 'nope', userId: 'ana' }),
    ).rejects.toThrow(OfferNotFoundError);
  });
});

describe('FindMatchesForOfferUseCase', () => {
  it('solo devuelve ofertas que pasan TradeMatcher', async () => {
    const ctx = setup();
    const mine = await ctx.offer('ana', ['BT1-010', 2], ['BT1-028', 1]);
    const exact = await ctx.offer('beto', ['BT1-028', 1], ['BT1-010', 2]);
    await ctx.offer('carla', ['BT1-028', 3], ['BT1-010', 2]); // candidato del repo, cantidades distintas
    await ctx.offer('carla', ['BT1-047', 1], ['BT1-010', 2]); // otra carta
    await ctx.offer('ana', ['BT1-028', 1], ['BT1-010', 2]); // inversa pero mía
    const cancelled = await ctx.offer('carla', ['BT1-028', 1], ['BT1-010', 2]);
    await ctx.cancel.execute({ offerId: cancelled.id, userId: 'carla' });

    const matches = await ctx.matches.execute({
      offerId: mine.id,
      userId: 'ana',
    });

    expect(matches.map((o) => o.id)).toEqual([exact.id]);
    expect(matches[0]?.owner.username).toBe('beto');
  });

  it('solo el dueño puede ver los matches → FORBIDDEN', async () => {
    const ctx = setup();
    const mine = await ctx.offer('ana');

    await expect(
      ctx.matches.execute({ offerId: mine.id, userId: 'beto' }),
    ).rejects.toThrow(NotOfferOwnerError);
  });

  it('oferta inexistente → OFFER_NOT_FOUND', async () => {
    await expect(
      setup().matches.execute({ offerId: 'nope', userId: 'ana' }),
    ).rejects.toThrow(OfferNotFoundError);
  });
});

describe('OfferViewAssembler', () => {
  it('una lista vacía no consulta nada', async () => {
    const ctx = setup();
    const spy = vi.spyOn(ctx.cards, 'findByIds');

    expect(await ctx.views.toViews([])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});
