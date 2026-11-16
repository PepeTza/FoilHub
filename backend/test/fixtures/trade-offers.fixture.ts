// Fábricas de ofertas para los tests (dominio y casos de uso).
import {
  TradeOffer,
  type TradeOfferProps,
} from '../../src/domain/entities/trade-offer.entity.js';
import { Quantity } from '../../src/domain/value-objects/quantity.vo.js';

export const T0 = new Date('2026-01-01T00:00:00Z');
export const T1 = new Date('2026-01-02T00:00:00Z');

export interface OfferSpec {
  id?: string;
  ownerId?: string;
  give?: [cardId: string, quantity: number];
  want?: [cardId: string, quantity: number];
  status?: TradeOfferProps['status'];
}

/** `offer({ ownerId: 'ana', give: ['agumon', 2], want: ['gabumon', 1] })` */
export function offer(spec: OfferSpec = {}): TradeOffer {
  const [offeredCardId, offered] = spec.give ?? ['agumon', 2];
  const [wantedCardId, wanted] = spec.want ?? ['gabumon', 1];
  const status = spec.status ?? 'OPEN';
  return TradeOffer.restore({
    id: spec.id ?? 'offer-1',
    ownerId: spec.ownerId ?? 'ana',
    offeredCardId,
    offeredQuantity: Quantity.create(offered),
    wantedCardId,
    wantedQuantity: Quantity.create(wanted),
    status,
    createdAt: T0,
    closedAt: status === 'OPEN' ? null : T1,
  });
}

/** La oferta inversa exacta de `offer()` por defecto, de otro usuario. */
export function inverseOffer(spec: OfferSpec = {}): TradeOffer {
  return offer({
    id: 'offer-2',
    ownerId: 'beto',
    give: ['gabumon', 1],
    want: ['agumon', 2],
    ...spec,
  });
}
