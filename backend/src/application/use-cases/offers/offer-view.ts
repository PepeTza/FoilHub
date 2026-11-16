import type {
  TradeOffer,
  OfferStatus,
} from '../../../domain/entities/trade-offer.entity.js';
import type { CardRepository } from '../../ports/card-repository.port.js';
import type { UserRepository } from '../../ports/user-repository.port.js';
import type { UserSummary } from '../auth/auth.types.js';
import { type CardOutput, toCardOutput } from '../cards/card.types.js';

/** Oferta con sus cartas y su dueño: lo que necesita OfferDto (§6). Tipo plano. */
export interface OfferView {
  id: string;
  owner: UserSummary;
  offered: { card: CardOutput; quantity: number };
  wanted: { card: CardOutput; quantity: number };
  status: OfferStatus;
  createdAt: Date;
  closedAt: Date | null;
}

/**
 * Arma OfferView para varias ofertas con UNA consulta de cartas y UNA de usuarios,
 * sin importar cuántas ofertas sean (evita N+1). También lo usa A7 para las propuestas.
 */
export class OfferViewAssembler {
  constructor(
    private readonly cards: CardRepository,
    private readonly users: UserRepository,
  ) {}

  async toView(offer: TradeOffer): Promise<OfferView> {
    const [view] = await this.toViews([offer]);
    return view!;
  }

  async toViews(offers: TradeOffer[]): Promise<OfferView[]> {
    if (offers.length === 0) {
      return [];
    }
    const cardIds = unique(
      offers.flatMap((o) => [o.offeredCardId, o.wantedCardId]),
    );
    const ownerIds = unique(offers.map((o) => o.ownerId));
    const [cards, owners] = await Promise.all([
      this.cards.findByIds(cardIds),
      this.users.findByIds(ownerIds),
    ]);
    const cardById = new Map(cards.map((c) => [c.id, toCardOutput(c)]));
    const ownerById = new Map(
      owners.map((u) => [u.id, { id: u.id, username: u.username.value }]),
    );

    return offers.map((offer) => ({
      id: offer.id,
      owner: required(ownerById, offer.ownerId, 'usuario'),
      offered: {
        card: required(cardById, offer.offeredCardId, 'carta'),
        quantity: offer.offeredQuantity.value,
      },
      wanted: {
        card: required(cardById, offer.wantedCardId, 'carta'),
        quantity: offer.wantedQuantity.value,
      },
      status: offer.status,
      createdAt: offer.createdAt,
      closedAt: offer.closedAt,
    }));
  }
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

/** Las FK de la BD garantizan que existen; si falta alguno es un bug, no un error de negocio. */
function required<T>(map: Map<string, T>, id: string, what: string): T {
  const value = map.get(id);
  if (!value) {
    throw new Error(`Inconsistencia: no se encontró ${what} ${id}`);
  }
  return value;
}
