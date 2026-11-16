import type { TradeOffer } from '../entities/trade-offer.entity.js';

/**
 * Dos ofertas hacen match si son exactamente inversas (docs/ARCHITECTURE.md §3).
 * El repositorio solo acota candidatos; la decisión final siempre se toma aquí.
 */
export const TradeMatcher = {
  isMatch(a: TradeOffer, b: TradeOffer): boolean {
    return (
      a.ownerId !== b.ownerId &&
      a.isOpen &&
      b.isOpen &&
      a.offeredCardId === b.wantedCardId &&
      a.wantedCardId === b.offeredCardId &&
      a.offeredQuantity.equals(b.wantedQuantity) &&
      a.wantedQuantity.equals(b.offeredQuantity)
    );
  },
};
