import {
  NotOfferOwnerError,
  OfferNotOpenError,
  SameCardTradeError,
} from '../errors/domain-errors.js';
import { offer, T0, T1 } from '../../../test/fixtures/trade-offers.fixture.js';
import { Quantity } from '../value-objects/quantity.vo.js';
import { TradeOffer } from './trade-offer.entity.js';

const newOffer = {
  id: 'offer-1',
  ownerId: 'ana',
  offeredCardId: 'agumon',
  offeredQuantity: Quantity.create(2),
  wantedCardId: 'gabumon',
  wantedQuantity: Quantity.create(1),
  createdAt: T0,
};

describe('TradeOffer.create', () => {
  it('crea la oferta OPEN y sin closedAt', () => {
    const created = TradeOffer.create(newOffer);

    expect(created.status).toBe('OPEN');
    expect(created.isOpen).toBe(true);
    expect(created.closedAt).toBeNull();
    expect(created).toMatchObject({
      id: 'offer-1',
      ownerId: 'ana',
      offeredCardId: 'agumon',
      wantedCardId: 'gabumon',
      createdAt: T0,
    });
    expect(created.offeredQuantity.value).toBe(2);
    expect(created.wantedQuantity.value).toBe(1);
  });

  it('falla con la misma carta en los dos lados', () => {
    expect(() =>
      TradeOffer.create({ ...newOffer, wantedCardId: 'agumon' }),
    ).toThrow(SameCardTradeError);
  });
});

describe('TradeOffer.cancel', () => {
  it('el dueño cancela una oferta OPEN y se asigna closedAt', () => {
    const o = offer();
    o.cancel('ana', T1);

    expect(o.status).toBe('CANCELLED');
    expect(o.closedAt).toBe(T1);
  });

  it('otro usuario no puede cancelarla', () => {
    const o = offer();
    expect(() => o.cancel('beto', T1)).toThrow(NotOfferOwnerError);
    expect(o.status).toBe('OPEN');
  });

  it.each(['CANCELLED', 'COMPLETED'] as const)(
    'no se puede cancelar si está %s',
    (status) => {
      expect(() => offer({ status }).cancel('ana', T1)).toThrow(
        OfferNotOpenError,
      );
    },
  );
});

describe('TradeOffer.complete', () => {
  it('completa una oferta OPEN y se asigna closedAt', () => {
    const o = offer();
    o.complete(T1);

    expect(o.status).toBe('COMPLETED');
    expect(o.isOpen).toBe(false);
    expect(o.closedAt).toBe(T1);
  });

  it.each(['CANCELLED', 'COMPLETED'] as const)(
    'no se puede completar si está %s',
    (status) => {
      expect(() => offer({ status }).complete(T1)).toThrow(OfferNotOpenError);
    },
  );
});
