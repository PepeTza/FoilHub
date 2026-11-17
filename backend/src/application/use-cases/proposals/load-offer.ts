import type { TradeOffer } from '../../../domain/entities/trade-offer.entity.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';

/** La oferta de una propuesta existe siempre (FK). Si falta, es un bug, no un error de negocio. */
export async function loadOffer(
  offers: TradeOfferRepository,
  offerId: string,
): Promise<TradeOffer> {
  const offer = await offers.findById(offerId);
  if (!offer) {
    throw new Error(`Inconsistencia: no se encontró la oferta ${offerId}`);
  }
  return offer;
}
