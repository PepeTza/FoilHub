import { Card } from '../../src/domain/entities/card.entity.js';
import { TradeProposal } from '../../src/domain/entities/trade-proposal.entity.js';
import { ConcurrencyConflictError } from '../../src/domain/errors/domain-errors.js';
import { CardCode } from '../../src/domain/value-objects/card-code.vo.js';
import {
  inverseOffer,
  offer,
  T0,
  T1,
} from '../fixtures/trade-offers.fixture.js';
import {
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  InMemoryCardRepository,
  InMemoryTradeOfferRepository,
  InMemoryTradeProposalRepository,
  InMemoryUnitOfWork,
  SequentialIdGenerator,
} from './index.js';

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

describe('fakes en memoria', () => {
  it('InMemoryCardRepository busca por nombre o código y pagina', async () => {
    const cards = new InMemoryCardRepository().seed(
      card('c1', 'BT1-010', 'Agumon'),
      card('c2', 'BT1-011', 'Greymon'),
      card('c3', 'ST1-03', 'Agumon X'),
    );

    const page = await cards.search({ text: 'agu', page: 1, pageSize: 1 });
    expect(page.total).toBe(2);
    expect(page.items.map((c) => c.id)).toEqual(['c1']);
    expect(
      (await cards.search({ text: 'st1', page: 1, pageSize: 10 })).total,
    ).toBe(1);
  });

  it('InMemoryCardRepository.upsertMany conserva el id de una carta existente', async () => {
    const cards = new InMemoryCardRepository().seed(
      card('c1', 'BT1-010', 'Agumon'),
    );

    await cards.upsertMany([card('nuevo', 'BT1-010', 'Agumon (renovado)')]);

    const stored = await cards.findByCode(CardCode.create('BT1-010'));
    expect(stored?.id).toBe('c1');
    expect(stored?.name).toBe('Agumon (renovado)');
  });

  it('InMemoryTradeOfferRepository filtra ofertas abiertas y candidatas a match', async () => {
    const offers = new InMemoryTradeOfferRepository().seed(
      offer(),
      inverseOffer(),
      offer({ id: 'offer-3', ownerId: 'carla', status: 'CANCELLED' }),
    );

    const open = await offers.listOpen({
      excludeOwnerId: 'ana',
      page: 1,
      pageSize: 10,
    });
    expect(open.items.map((o) => o.id)).toEqual(['offer-2']);
    expect(
      (await offers.findMatchCandidates(offer())).map((o) => o.id),
    ).toEqual(['offer-2']);
    expect(await offers.listByOwner('carla', 'OPEN')).toEqual([]);
  });

  it('InMemoryTradeOfferRepository: cerrar dos veces la misma oferta es un conflicto', async () => {
    const offers = new InMemoryTradeOfferRepository().seed(offer());
    const first = (await offers.findById('offer-1'))!;
    const second = (await offers.findById('offer-1'))!;

    first.complete(T1);
    await offers.save(first);
    second.complete(T1);

    await expect(offers.save(second)).rejects.toThrow(ConcurrencyConflictError);
  });

  it('los repos guardan copias: modificar sin save() no cambia nada', async () => {
    const offers = new InMemoryTradeOfferRepository().seed(offer());
    (await offers.findById('offer-1'))!.complete(T1);

    expect((await offers.findById('offer-1'))!.isOpen).toBe(true);
  });

  it('InMemoryTradeProposalRepository lista enviadas y recibidas', async () => {
    const offers = new InMemoryTradeOfferRepository().seed(offer());
    const proposals = new InMemoryTradeProposalRepository(offers);
    await proposals.save(
      TradeProposal.create({
        id: 'p1',
        offer: offer(),
        proposerId: 'beto',
        counterOffer: null,
        message: null,
        createdAt: T0,
      }),
    );

    expect(
      await proposals.listForUser({ userId: 'beto', box: 'sent' }),
    ).toHaveLength(1);
    expect(
      await proposals.listForUser({ userId: 'ana', box: 'received' }),
    ).toHaveLength(1);
    expect(
      await proposals.listForUser({ userId: 'ana', box: 'sent' }),
    ).toHaveLength(0);
    expect(await proposals.existsPending('offer-1', 'beto')).toBe(true);
    expect(await proposals.findPendingByOffer('offer-1')).toHaveLength(1);
  });

  it('InMemoryUnitOfWork deshace los cambios si el trabajo lanza', async () => {
    const offers = new InMemoryTradeOfferRepository().seed(offer());
    const uow = new InMemoryUnitOfWork(
      offers,
      new InMemoryTradeProposalRepository(offers),
    );

    await expect(
      uow.run(async (repos) => {
        const o = (await repos.offers.findById('offer-1'))!;
        o.cancel('ana', T1);
        await repos.offers.save(o);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    expect((await offers.findById('offer-1'))!.isOpen).toBe(true);
  });

  it('fakes de servicios', async () => {
    const hasher = new FakePasswordHasher();
    expect(await hasher.verify('secreta1', await hasher.hash('secreta1'))).toBe(
      true,
    );
    expect(await hasher.verify('otra', await hasher.hash('secreta1'))).toBe(
      false,
    );

    const tokens = new FakeTokenService();
    expect(
      await tokens.verify(await tokens.sign({ sub: 'u1', username: 'ana' })),
    ).toEqual({ sub: 'u1', username: 'ana' });
    await expect(tokens.verify('basura')).rejects.toThrow();

    const ids = new SequentialIdGenerator('user');
    expect([ids.next(), ids.next()]).toEqual(['user-1', 'user-2']);

    const clock = new FixedClock(T0);
    clock.advance(1000);
    expect(clock.now().getTime()).toBe(T0.getTime() + 1000);
  });
});
