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
import { User } from '../../../domain/entities/user.entity.js';
import {
  CannotTradeWithYourselfError,
  ConcurrencyConflictError,
  CounterOfferNotMatchingError,
  DuplicateProposalError,
  NotOfferOwnerError,
  NotProposalPartyError,
  OfferNotFoundError,
  OfferNotOpenError,
  ProposalNotFoundError,
  ProposalNotPendingError,
} from '../../../domain/errors/domain-errors.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import { Username } from '../../../domain/value-objects/username.vo.js';
import { CancelTradeOfferUseCase } from '../offers/cancel-trade-offer.use-case.js';
import { CreateTradeOfferUseCase } from '../offers/create-trade-offer.use-case.js';
import { OfferViewAssembler } from '../offers/offer-view.js';
import { AcceptProposalUseCase } from './accept-proposal.use-case.js';
import { CancelProposalUseCase } from './cancel-proposal.use-case.js';
import { ListMyProposalsUseCase } from './list-my-proposals.use-case.js';
import { ProposalViewAssembler } from './proposal-view.js';
import { ProposeTradeUseCase } from './propose-trade.use-case.js';
import { RejectProposalUseCase } from './reject-proposal.use-case.js';

const card = (id: string, code: string, name: string) =>
  Card.create({
    id,
    code: CardCode.create(code),
    name,
    setName: null,
    rarity: null,
    color: null,
    cardType: null,
    imageUrl: null,
  });

const user = (id: string, contactInfo: string | null) =>
  User.create({
    id,
    username: Username.create(id),
    passwordHash: 'h',
    contactInfo,
    createdAt: new Date(0),
  });

function setup() {
  const cards = new InMemoryCardRepository().seed(
    card('agumon', 'BT1-010', 'Agumon'),
    card('gabumon', 'BT1-028', 'Gabumon'),
    card('patamon', 'BT1-047', 'Patamon'),
  );
  const users = new InMemoryUserRepository().seed(
    user('ana', 'ana#1'),
    user('beto', 'beto@mail'),
    user('carla', null),
  );
  const offers = new InMemoryTradeOfferRepository();
  const proposals = new InMemoryTradeProposalRepository(offers);
  const uow = new InMemoryUnitOfWork(offers, proposals);
  const clock = new FixedClock(new Date('2026-03-01T10:00:00Z'));
  const offerViews = new OfferViewAssembler(cards, users);
  const views = new ProposalViewAssembler(offers, users, offerViews);
  const createOffer = new CreateTradeOfferUseCase(
    offers,
    cards,
    new SequentialIdGenerator('offer'),
    clock,
    offerViews,
  );

  return {
    offers,
    proposals,
    users,
    clock,
    uow,
    propose: new ProposeTradeUseCase(
      offers,
      proposals,
      new SequentialIdGenerator('prop'),
      clock,
      views,
    ),
    list: new ListMyProposalsUseCase(proposals, views),
    accept: new AcceptProposalUseCase(uow, clock, views),
    reject: new RejectProposalUseCase(proposals, offers, clock, views),
    cancel: new CancelProposalUseCase(proposals, clock, views),
    cancelOffer: new CancelTradeOfferUseCase(uow, clock, offerViews),
    /** Por defecto: da 2 Agumon, quiere 1 Gabumon. */
    offer: async (
      ownerId: string,
      give: [string, number] = ['BT1-010', 2],
      want: [string, number] = ['BT1-028', 1],
    ) =>
      (
        await createOffer.execute({
          ownerId,
          offeredCardCode: give[0],
          offeredQuantity: give[1],
          wantedCardCode: want[0],
          wantedQuantity: want[1],
        })
      ).id,
  };
}

/** ana publica; beto tiene la inversa exacta. */
async function anaAndBeto() {
  const ctx = setup();
  const anaOffer = await ctx.offer('ana');
  const betoOffer = await ctx.offer('beto', ['BT1-028', 1], ['BT1-010', 2]);
  return { ...ctx, anaOffer, betoOffer };
}

describe('ProposeTradeUseCase', () => {
  it('crea una propuesta PENDING con la oferta, el proponente y la contraoferta', async () => {
    const { propose, anaOffer, betoOffer, clock } = await anaAndBeto();

    const view = await propose.execute({
      offerId: anaOffer,
      proposerId: 'beto',
      counterOfferId: betoOffer,
      message: ' ¿Va? ',
    });

    expect(view).toMatchObject({
      id: 'prop-1',
      offer: { id: anaOffer, owner: { username: 'ana' } },
      proposer: { id: 'beto', username: 'beto' },
      counterOffer: { id: betoOffer, owner: { username: 'beto' } },
      message: '¿Va?',
      status: 'PENDING',
      createdAt: clock.now(),
      respondedAt: null,
      contacts: null,
    });
  });

  it('sin contraoferta ni mensaje', async () => {
    const { propose, anaOffer } = await anaAndBeto();
    const view = await propose.execute({
      offerId: anaOffer,
      proposerId: 'carla',
    });

    expect(view).toMatchObject({ counterOffer: null, message: null });
  });

  it('proponer sobre la oferta propia → SELF_TRADE', async () => {
    const { propose, anaOffer } = await anaAndBeto();
    await expect(
      propose.execute({ offerId: anaOffer, proposerId: 'ana' }),
    ).rejects.toThrow(CannotTradeWithYourselfError);
  });

  it('propuesta duplicada (otra PENDING del mismo usuario) → DUPLICATE_PROPOSAL', async () => {
    const { propose, anaOffer } = await anaAndBeto();
    await propose.execute({ offerId: anaOffer, proposerId: 'beto' });

    await expect(
      propose.execute({ offerId: anaOffer, proposerId: 'beto' }),
    ).rejects.toThrow(DuplicateProposalError);
  });

  it('se puede volver a proponer si la anterior ya no está PENDING', async () => {
    const { propose, cancel, anaOffer } = await anaAndBeto();
    const first = await propose.execute({
      offerId: anaOffer,
      proposerId: 'beto',
    });
    await cancel.execute({ proposalId: first.id, userId: 'beto' });

    await expect(
      propose.execute({ offerId: anaOffer, proposerId: 'beto' }),
    ).resolves.toMatchObject({ status: 'PENDING' });
  });

  it.each([
    ['cantidades distintas', ['BT1-028', 3], ['BT1-010', 2]],
    ['otra carta', ['BT1-047', 1], ['BT1-010', 2]],
  ] as const)(
    'counterOfferId que no hace match (%s) → COUNTER_OFFER_NOT_MATCHING',
    async (_case, give, want) => {
      const ctx = await anaAndBeto();
      const notMatching = await ctx.offer('beto', [...give], [...want]);

      await expect(
        ctx.propose.execute({
          offerId: ctx.anaOffer,
          proposerId: 'beto',
          counterOfferId: notMatching,
        }),
      ).rejects.toThrow(CounterOfferNotMatchingError);
    },
  );

  it('counterOfferId de otro usuario o inexistente → COUNTER_OFFER_NOT_MATCHING', async () => {
    const { propose, anaOffer, betoOffer } = await anaAndBeto();

    await expect(
      propose.execute({
        offerId: anaOffer,
        proposerId: 'carla',
        counterOfferId: betoOffer,
      }),
    ).rejects.toThrow(CounterOfferNotMatchingError);
    await expect(
      propose.execute({
        offerId: anaOffer,
        proposerId: 'beto',
        counterOfferId: 'nope',
      }),
    ).rejects.toThrow(CounterOfferNotMatchingError);
  });

  it('oferta inexistente → OFFER_NOT_FOUND; oferta cancelada → OFFER_NOT_OPEN', async () => {
    const { propose, cancelOffer, anaOffer } = await anaAndBeto();
    await expect(
      propose.execute({ offerId: 'nope', proposerId: 'beto' }),
    ).rejects.toThrow(OfferNotFoundError);

    await cancelOffer.execute({ offerId: anaOffer, userId: 'ana' });
    await expect(
      propose.execute({ offerId: anaOffer, proposerId: 'beto' }),
    ).rejects.toThrow(OfferNotOpenError);
  });
});

describe('AcceptProposalUseCase', () => {
  it('completa oferta y contraoferta, rechaza las demás pendientes y revela los contactos', async () => {
    const ctx = await anaAndBeto();
    const withCounter = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
      counterOfferId: ctx.betoOffer,
    });
    const other = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'carla',
    });
    const onCounter = await ctx.propose.execute({
      offerId: ctx.betoOffer,
      proposerId: 'carla',
    });
    ctx.clock.advance(60_000);

    const view = await ctx.accept.execute({
      proposalId: withCounter.id,
      userId: 'ana',
    });

    expect(view).toMatchObject({
      status: 'ACCEPTED',
      respondedAt: ctx.clock.now(),
      offer: { status: 'COMPLETED', closedAt: ctx.clock.now() },
      counterOffer: { status: 'COMPLETED' },
      contacts: { offerOwner: 'ana#1', proposer: 'beto@mail' },
    });
    expect((await ctx.offers.findById(ctx.anaOffer))?.status).toBe('COMPLETED');
    expect((await ctx.offers.findById(ctx.betoOffer))?.status).toBe(
      'COMPLETED',
    );
    expect((await ctx.proposals.findById(other.id))?.status).toBe('REJECTED');
    expect((await ctx.proposals.findById(onCounter.id))?.status).toBe(
      'REJECTED',
    );
  });

  it('sin contraoferta solo completa la oferta', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'carla',
    });

    const view = await ctx.accept.execute({ proposalId: p.id, userId: 'ana' });

    expect(view.offer.status).toBe('COMPLETED');
    expect(view.counterOffer).toBeNull();
    expect(view.contacts).toEqual({ offerOwner: 'ana#1', proposer: null });
    expect((await ctx.offers.findById(ctx.betoOffer))?.status).toBe('OPEN');
  });

  it('aceptar una propuesta ajena → FORBIDDEN y no cambia nada', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });

    for (const userId of ['beto', 'carla']) {
      await expect(
        ctx.accept.execute({ proposalId: p.id, userId }),
      ).rejects.toThrow(NotOfferOwnerError);
    }
    expect((await ctx.offers.findById(ctx.anaOffer))?.status).toBe('OPEN');
    expect((await ctx.proposals.findById(p.id))?.status).toBe('PENDING');
  });

  it('aceptar dos veces → PROPOSAL_NOT_PENDING; inexistente → PROPOSAL_NOT_FOUND', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });
    await ctx.accept.execute({ proposalId: p.id, userId: 'ana' });

    await expect(
      ctx.accept.execute({ proposalId: p.id, userId: 'ana' }),
    ).rejects.toThrow(ProposalNotPendingError);
    await expect(
      ctx.accept.execute({ proposalId: 'nope', userId: 'ana' }),
    ).rejects.toThrow(ProposalNotFoundError);
  });

  it('si la contraoferta ya no está abierta → OFFER_NOT_OPEN y rollback completo', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
      counterOfferId: ctx.betoOffer,
    });
    await ctx.cancelOffer.execute({ offerId: ctx.betoOffer, userId: 'beto' }); // también rechaza propuestas sobre ella

    await expect(
      ctx.accept.execute({ proposalId: p.id, userId: 'ana' }),
    ).rejects.toThrow(OfferNotOpenError);
    expect((await ctx.offers.findById(ctx.anaOffer))?.status).toBe('OPEN');
    expect((await ctx.proposals.findById(p.id))?.status).toBe('PENDING');
  });

  it('si otro aceptó la oferta mientras tanto → CONCURRENCY_CONFLICT y rollback', async () => {
    const ctx = await anaAndBeto();
    const p1 = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });
    const p2 = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'carla',
    });
    // Lo que leyó el segundo accept ANTES de que el primero confirmara: oferta OPEN y p2 PENDING.
    const staleOffer = (await ctx.offers.findById(ctx.anaOffer))!;
    const staleP2 = (await ctx.proposals.findById(p2.id))!;
    await ctx.accept.execute({ proposalId: p1.id, userId: 'ana' });
    vi.spyOn(ctx.proposals, 'findById').mockResolvedValueOnce(staleP2);
    vi.spyOn(ctx.offers, 'findById').mockResolvedValueOnce(staleOffer);

    await expect(
      ctx.accept.execute({ proposalId: p2.id, userId: 'ana' }),
    ).rejects.toThrow(ConcurrencyConflictError);
    expect((await ctx.proposals.findById(p1.id))?.status).toBe('ACCEPTED');
    expect((await ctx.proposals.findById(p2.id))?.status).toBe('REJECTED');
  });
});

describe('RejectProposalUseCase y CancelProposalUseCase', () => {
  it('el dueño de la oferta rechaza; la oferta sigue OPEN', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });

    const view = await ctx.reject.execute({ proposalId: p.id, userId: 'ana' });

    expect(view).toMatchObject({
      status: 'REJECTED',
      respondedAt: ctx.clock.now(),
      contacts: null,
      offer: { status: 'OPEN' },
    });
  });

  it('rechazar una propuesta ajena → FORBIDDEN', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });

    await expect(
      ctx.reject.execute({ proposalId: p.id, userId: 'beto' }),
    ).rejects.toThrow(NotOfferOwnerError);
    await expect(
      ctx.reject.execute({ proposalId: 'nope', userId: 'ana' }),
    ).rejects.toThrow(ProposalNotFoundError);
  });

  it('solo el proponente puede cancelar', async () => {
    const ctx = await anaAndBeto();
    const p = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });

    await expect(
      ctx.cancel.execute({ proposalId: p.id, userId: 'ana' }),
    ).rejects.toThrow(NotProposalPartyError);
    await expect(
      ctx.cancel.execute({ proposalId: p.id, userId: 'carla' }),
    ).rejects.toThrow(NotProposalPartyError);
    await expect(
      ctx.cancel.execute({ proposalId: p.id, userId: 'beto' }),
    ).resolves.toMatchObject({ status: 'CANCELLED' });
    await expect(
      ctx.cancel.execute({ proposalId: p.id, userId: 'beto' }),
    ).rejects.toThrow(ProposalNotPendingError);
    await expect(
      ctx.cancel.execute({ proposalId: 'nope', userId: 'beto' }),
    ).rejects.toThrow(ProposalNotFoundError);
  });
});

describe('ListMyProposalsUseCase y contactos', () => {
  it('received/sent con filtro de estado', async () => {
    const ctx = await anaAndBeto();
    const p1 = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });
    const p2 = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'carla',
    });
    await ctx.reject.execute({ proposalId: p2.id, userId: 'ana' });

    expect(
      (await ctx.list.execute({ userId: 'ana', box: 'received' }))
        .map((p) => p.id)
        .sort(),
    ).toEqual([p1.id, p2.id].sort());
    expect(
      (
        await ctx.list.execute({
          userId: 'ana',
          box: 'received',
          status: 'PENDING',
        })
      ).map((p) => p.id),
    ).toEqual([p1.id]);
    expect(
      (await ctx.list.execute({ userId: 'beto', box: 'sent' })).map(
        (p) => p.id,
      ),
    ).toEqual([p1.id]);
    expect(await ctx.list.execute({ userId: 'ana', box: 'sent' })).toEqual([]);
  });

  it('contacts es null para propuestas no aceptadas y para quien no es parte', async () => {
    const ctx = await anaAndBeto();
    const accepted = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'beto',
    });
    const rejected = await ctx.propose.execute({
      offerId: ctx.anaOffer,
      proposerId: 'carla',
    });
    await ctx.accept.execute({ proposalId: accepted.id, userId: 'ana' });

    const [forAna] = await ctx.list.execute({
      userId: 'ana',
      box: 'received',
      status: 'ACCEPTED',
    });
    const [forBeto] = await ctx.list.execute({ userId: 'beto', box: 'sent' });
    const [forCarla] = await ctx.list.execute({ userId: 'carla', box: 'sent' });

    expect(forAna?.contacts).toEqual({
      offerOwner: 'ana#1',
      proposer: 'beto@mail',
    });
    expect(forBeto?.contacts).toEqual({
      offerOwner: 'ana#1',
      proposer: 'beto@mail',
    });
    expect(forCarla).toMatchObject({
      id: rejected.id,
      status: 'REJECTED',
      contacts: null,
    });
  });

  it('carga ofertas y usuarios en lote (sin N+1)', async () => {
    const ctx = await anaAndBeto();
    // beto propone sobre 3 ofertas distintas (de ana y de carla).
    for (const offerId of [
      ctx.anaOffer,
      await ctx.offer('carla'),
      await ctx.offer('carla', ['BT1-047', 1]),
    ]) {
      await ctx.propose.execute({ offerId, proposerId: 'beto' });
    }
    const offersByIds = vi.spyOn(ctx.offers, 'findByIds');
    const offerById = vi.spyOn(ctx.offers, 'findById');
    const userById = vi.spyOn(ctx.users, 'findById');

    const sent = await ctx.list.execute({ userId: 'beto', box: 'sent' });

    expect(sent).toHaveLength(3);

    expect(offersByIds).toHaveBeenCalledTimes(1);
    expect(offerById).not.toHaveBeenCalled();
    expect(userById).not.toHaveBeenCalled();
  });
});
