import { TradeOffer } from '../../../domain/entities/trade-offer.entity.js';
import { Quantity } from '../../../domain/value-objects/quantity.vo.js';
import type { TradeOffer as TradeOfferRow } from '../../../generated/prisma/client.js';

export const TradeOfferMapper = {
  toDomain(row: TradeOfferRow): TradeOffer {
    return TradeOffer.restore({
      id: row.id,
      ownerId: row.ownerId,
      offeredCardId: row.offeredCardId,
      offeredQuantity: Quantity.restore(row.offeredQuantity),
      wantedCardId: row.wantedCardId,
      wantedQuantity: Quantity.restore(row.wantedQuantity),
      status: row.status,
      createdAt: row.createdAt,
      closedAt: row.closedAt,
    });
  },

  toPersistence(offer: TradeOffer): TradeOfferRow {
    return {
      id: offer.id,
      ownerId: offer.ownerId,
      offeredCardId: offer.offeredCardId,
      offeredQuantity: offer.offeredQuantity.value,
      wantedCardId: offer.wantedCardId,
      wantedQuantity: offer.wantedQuantity.value,
      status: offer.status,
      createdAt: offer.createdAt,
      closedAt: offer.closedAt,
    };
  },
};
