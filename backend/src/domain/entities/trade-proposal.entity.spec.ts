import {
  CannotTradeWithYourselfError,
  CounterOfferNotMatchingError,
  NotOfferOwnerError,
  NotProposalPartyError,
  OfferNotOpenError,
  ProposalNotPendingError,
} from '../errors/domain-errors.js';
import {
  inverseOffer,
  offer,
  T0,
  T1,
} from '../../../test/fixtures/trade-offers.fixture.js';
import { TradeProposal, type ProposalStatus } from './trade-proposal.entity.js';

// ana es dueña de la oferta; beto propone.
function propose(
  overrides: Partial<Parameters<typeof TradeProposal.create>[0]> = {},
): TradeProposal {
  return TradeProposal.create({
    id: 'prop-1',
    offer: offer(),
    proposerId: 'beto',
    counterOffer: null,
    message: null,
    createdAt: T0,
    ...overrides,
  });
}

function proposalIn(status: ProposalStatus): TradeProposal {
  return TradeProposal.restore({
    id: 'prop-1',
    offerId: 'offer-1',
    proposerId: 'beto',
    counterOfferId: null,
    message: null,
    status,
    createdAt: T0,
    respondedAt: status === 'PENDING' ? null : T1,
  });
}

const NOT_PENDING: ProposalStatus[] = ['ACCEPTED', 'REJECTED', 'CANCELLED'];

describe('TradeProposal.create', () => {
  it('crea una propuesta PENDING sobre una oferta ajena', () => {
    const p = propose({ message: '  ¿Trato?  ' });

    expect(p).toMatchObject({
      id: 'prop-1',
      offerId: 'offer-1',
      proposerId: 'beto',
      counterOfferId: null,
      message: '¿Trato?',
      status: 'PENDING',
      createdAt: T0,
      respondedAt: null,
    });
    expect(p.isPending).toBe(true);
  });

  it('un mensaje vacío se guarda como null', () => {
    expect(propose({ message: '   ' }).message).toBeNull();
  });

  it('no se puede proponer sobre la oferta propia', () => {
    expect(() => propose({ proposerId: 'ana' })).toThrow(
      CannotTradeWithYourselfError,
    );
  });

  it('no se puede proponer sobre una oferta que no está OPEN', () => {
    expect(() => propose({ offer: offer({ status: 'CANCELLED' }) })).toThrow(
      OfferNotOpenError,
    );
  });

  it('acepta una contraoferta del proponente que hace match', () => {
    expect(propose({ counterOffer: inverseOffer() }).counterOfferId).toBe(
      'offer-2',
    );
  });

  it('rechaza una contraoferta que no hace match', () => {
    const counterOffer = inverseOffer({ give: ['gabumon', 3] });
    expect(() => propose({ counterOffer })).toThrow(
      CounterOfferNotMatchingError,
    );
  });

  it('rechaza una contraoferta que no es del proponente', () => {
    const counterOffer = inverseOffer({ ownerId: 'carla' });
    expect(() => propose({ counterOffer })).toThrow(
      CounterOfferNotMatchingError,
    );
  });
});

describe('TradeProposal.accept', () => {
  it('el dueño de la oferta acepta una propuesta PENDING', () => {
    const p = propose();
    p.accept('ana', offer(), T1);

    expect(p.status).toBe('ACCEPTED');
    expect(p.respondedAt).toBe(T1);
  });

  it('otro usuario no puede aceptarla', () => {
    expect(() => propose().accept('beto', offer(), T1)).toThrow(
      NotOfferOwnerError,
    );
  });

  it.each(NOT_PENDING)('no se puede aceptar si está %s', (status) => {
    expect(() => proposalIn(status).accept('ana', offer(), T1)).toThrow(
      ProposalNotPendingError,
    );
  });

  it('no se puede aceptar si la oferta ya no está OPEN', () => {
    expect(() =>
      propose().accept('ana', offer({ status: 'COMPLETED' }), T1),
    ).toThrow(OfferNotOpenError);
  });

  it('falla si se le pasa otra oferta', () => {
    expect(() => propose().accept('ana', offer({ id: 'otra' }), T1)).toThrow(
      /no corresponde/,
    );
  });
});

describe('TradeProposal.reject', () => {
  it('el dueño de la oferta rechaza una propuesta PENDING', () => {
    const p = propose();
    p.reject('ana', offer(), T1);

    expect(p.status).toBe('REJECTED');
    expect(p.respondedAt).toBe(T1);
  });

  it('otro usuario no puede rechazarla', () => {
    expect(() => propose().reject('carla', offer(), T1)).toThrow(
      NotOfferOwnerError,
    );
  });

  it.each(NOT_PENDING)('no se puede rechazar si está %s', (status) => {
    expect(() => proposalIn(status).reject('ana', offer(), T1)).toThrow(
      ProposalNotPendingError,
    );
  });
});

describe('TradeProposal.cancel', () => {
  it('el proponente la retira', () => {
    const p = propose();
    p.cancel('beto', T1);

    expect(p.status).toBe('CANCELLED');
    expect(p.respondedAt).toBe(T1);
  });

  it('el dueño de la oferta no puede cancelarla', () => {
    expect(() => propose().cancel('ana', T1)).toThrow(NotProposalPartyError);
  });

  it.each(NOT_PENDING)('no se puede cancelar si está %s', (status) => {
    expect(() => proposalIn(status).cancel('beto', T1)).toThrow(
      ProposalNotPendingError,
    );
  });
});

describe('TradeProposal.autoReject', () => {
  it('rechaza una propuesta PENDING', () => {
    const p = propose();
    p.autoReject(T1);

    expect(p.status).toBe('REJECTED');
    expect(p.respondedAt).toBe(T1);
  });

  it.each(NOT_PENDING)('falla si está %s', (status) => {
    expect(() => proposalIn(status).autoReject(T1)).toThrow(
      ProposalNotPendingError,
    );
  });
});
