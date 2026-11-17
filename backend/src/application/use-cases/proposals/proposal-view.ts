import type {
  ProposalStatus,
  TradeProposal,
} from '../../../domain/entities/trade-proposal.entity.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { UserRepository } from '../../ports/user-repository.port.js';
import type { UserSummary } from '../auth/auth.types.js';
import type { OfferView, OfferViewAssembler } from '../offers/offer-view.js';

export interface ProposalContacts {
  offerOwner: string | null;
  proposer: string | null;
}

/** Propuesta con sus ofertas, el proponente y (si corresponde) los contactos: ProposalDto (§6). */
export interface ProposalView {
  id: string;
  offer: OfferView;
  proposer: UserSummary;
  counterOffer: OfferView | null;
  message: string | null;
  status: ProposalStatus;
  createdAt: Date;
  respondedAt: Date | null;
  /** Solo si la propuesta está ACCEPTED y quien consulta es una de las partes. */
  contacts: ProposalContacts | null;
}

/**
 * Arma ProposalView para varias propuestas con un número fijo de consultas
 * (ofertas en lote, usuarios en lote y OfferViewAssembler en lote), sin N+1.
 */
export class ProposalViewAssembler {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly users: UserRepository,
    private readonly offerViews: OfferViewAssembler,
  ) {}

  async toView(
    proposal: TradeProposal,
    viewerId: string,
  ): Promise<ProposalView> {
    const [view] = await this.toViews([proposal], viewerId);
    return view!;
  }

  async toViews(
    proposals: TradeProposal[],
    viewerId: string,
  ): Promise<ProposalView[]> {
    if (proposals.length === 0) {
      return [];
    }
    const offerIds = unique(
      proposals.flatMap((p) =>
        p.counterOfferId ? [p.offerId, p.counterOfferId] : [p.offerId],
      ),
    );
    const offers = await this.offers.findByIds(offerIds);
    const offerById = new Map(offers.map((o) => [o.id, o]));

    const userIds = unique([
      ...proposals.map((p) => p.proposerId),
      ...offers.map((o) => o.ownerId),
    ]);
    const [users, offerViews] = await Promise.all([
      this.users.findByIds(userIds),
      this.offerViews.toViews(offers),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const offerViewById = new Map(offerViews.map((v) => [v.id, v]));

    return proposals.map((p) => {
      const offer = required(offerById, p.offerId, 'oferta');
      const proposer = required(userById, p.proposerId, 'usuario');
      return {
        id: p.id,
        offer: required(offerViewById, p.offerId, 'oferta'),
        proposer: { id: proposer.id, username: proposer.username.value },
        counterOffer: p.counterOfferId
          ? required(offerViewById, p.counterOfferId, 'oferta')
          : null,
        message: p.message,
        status: p.status,
        createdAt: p.createdAt,
        respondedAt: p.respondedAt,
        contacts: p.revealsContactsTo(viewerId, offer)
          ? {
              offerOwner: required(userById, offer.ownerId, 'usuario')
                .contactInfo,
              proposer: proposer.contactInfo,
            }
          : null,
      };
    });
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
