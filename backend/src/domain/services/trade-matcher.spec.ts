import {
  inverseOffer,
  offer,
} from '../../../test/fixtures/trade-offers.fixture.js';
import { TradeMatcher } from './trade-matcher.js';

describe('TradeMatcher.isMatch', () => {
  // ana da 2 agumon y quiere 1 gabumon; beto da 1 gabumon y quiere 2 agumon.
  const a = offer();

  it('es match cuando las ofertas son inversas exactas', () => {
    expect(TradeMatcher.isMatch(a, inverseOffer())).toBe(true);
    expect(TradeMatcher.isMatch(inverseOffer(), a)).toBe(true);
  });

  it('1. no es match si las dos ofertas son del mismo dueño', () => {
    expect(TradeMatcher.isMatch(a, inverseOffer({ ownerId: 'ana' }))).toBe(
      false,
    );
  });

  it('2. no es match si alguna no está OPEN', () => {
    expect(TradeMatcher.isMatch(a, inverseOffer({ status: 'CANCELLED' }))).toBe(
      false,
    );
    expect(
      TradeMatcher.isMatch(offer({ status: 'COMPLETED' }), inverseOffer()),
    ).toBe(false);
  });

  it('3. no es match si las cartas no están invertidas', () => {
    expect(
      TradeMatcher.isMatch(a, inverseOffer({ give: ['patamon', 1] })),
    ).toBe(false);
    expect(
      TradeMatcher.isMatch(a, inverseOffer({ want: ['patamon', 2] })),
    ).toBe(false);
  });

  it('4. no es match si las cantidades no coinciden exactamente', () => {
    expect(
      TradeMatcher.isMatch(a, inverseOffer({ give: ['gabumon', 2] })),
    ).toBe(false);
    expect(TradeMatcher.isMatch(a, inverseOffer({ want: ['agumon', 3] }))).toBe(
      false,
    );
  });
});
