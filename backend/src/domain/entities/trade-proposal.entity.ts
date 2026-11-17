import {
  CannotTradeWithYourselfError,
  CounterOfferNotMatchingError,
  NotOfferOwnerError,
  NotProposalPartyError,
  OfferNotOpenError,
  ProposalNotPendingError,
} from '../errors/domain-errors.js';
import { TradeMatcher } from '../services/trade-matcher.js';
import type { TradeOffer } from './trade-offer.entity.js';
import { normalizeOptionalText } from './user.entity.js';

export const PROPOSAL_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export interface TradeProposalProps {
  id: string;
  offerId: string;
  proposerId: string;
  counterOfferId: string | null;
  /** El límite de 280 caracteres lo valida el DTO (capa 3). */
  message: string | null;
  status: ProposalStatus;
  createdAt: Date;
  respondedAt: Date | null;
}

export interface NewTradeProposalProps {
  id: string;
  /** La oferta sobre la que se propone. */
  offer: TradeOffer;
  proposerId: string;
  /** Oferta del proponente que debe ser la inversa exacta de `offer`. */
  counterOffer: TradeOffer | null;
  message: string | null;
  createdAt: Date;
}

/** Propuesta sobre una oferta ajena. PENDING → ACCEPTED | REJECTED | CANCELLED. */
export class TradeProposal {
  private constructor(private readonly props: TradeProposalProps) {}

  static create(input: NewTradeProposalProps): TradeProposal {
    const { offer, counterOffer, proposerId } = input;
    if (offer.isOwnedBy(proposerId)) {
      throw new CannotTradeWithYourselfError();
    }
    if (!offer.isOpen) {
      throw new OfferNotOpenError();
    }
    if (
      counterOffer &&
      (!counterOffer.isOwnedBy(proposerId) ||
        !TradeMatcher.isMatch(offer, counterOffer))
    ) {
      throw new CounterOfferNotMatchingError();
    }
    return new TradeProposal({
      id: input.id,
      offerId: offer.id,
      proposerId,
      counterOfferId: counterOffer?.id ?? null,
      message: normalizeOptionalText(input.message),
      status: 'PENDING',
      createdAt: input.createdAt,
      respondedAt: null,
    });
  }

  static restore(props: TradeProposalProps): TradeProposal {
    return new TradeProposal({ ...props });
  }

  /** Solo el dueño de la oferta, solo si la propuesta está PENDING y la oferta OPEN. */
  accept(byUserId: string, offer: TradeOffer, at: Date): void {
    this.assertRespondableBy(byUserId, offer);
    // Primero el estado de la propuesta: aceptar dos veces es PROPOSAL_NOT_PENDING, no OFFER_NOT_OPEN.
    if (!this.isPending) {
      throw new ProposalNotPendingError();
    }
    if (!offer.isOpen) {
      throw new OfferNotOpenError();
    }
    this.respond('ACCEPTED', at);
  }

  /** Solo el dueño de la oferta, solo si está PENDING. */
  reject(byUserId: string, offer: TradeOffer, at: Date): void {
    this.assertRespondableBy(byUserId, offer);
    this.respond('REJECTED', at);
  }

  /** Solo el proponente, solo si está PENDING. */
  cancel(byUserId: string, at: Date): void {
    if (byUserId !== this.props.proposerId) {
      throw new NotProposalPartyError();
    }
    this.respond('CANCELLED', at);
  }

  /** La oferta se completó con otra propuesta o se canceló. */
  autoReject(at: Date): void {
    this.respond('REJECTED', at);
  }

  /**
   * Los contactos de las dos partes solo se revelan cuando la propuesta fue ACEPTADA
   * y quien consulta es el dueño de la oferta o el proponente.
   */
  revealsContactsTo(viewerId: string, offer: TradeOffer): boolean {
    if (offer.id !== this.props.offerId) {
      throw new Error(
        `La oferta ${offer.id} no corresponde a la propuesta ${this.props.id}`,
      );
    }
    return (
      this.props.status === 'ACCEPTED' &&
      (viewerId === this.props.proposerId || offer.isOwnedBy(viewerId))
    );
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  private assertRespondableBy(byUserId: string, offer: TradeOffer): void {
    if (offer.id !== this.props.offerId) {
      throw new Error(
        `La oferta ${offer.id} no corresponde a la propuesta ${this.props.id}`,
      );
    }
    if (!offer.isOwnedBy(byUserId)) {
      throw new NotOfferOwnerError();
    }
  }

  private respond(status: Exclude<ProposalStatus, 'PENDING'>, at: Date): void {
    if (!this.isPending) {
      throw new ProposalNotPendingError();
    }
    this.props.status = status;
    this.props.respondedAt = at;
  }

  get id(): string {
    return this.props.id;
  }
  get offerId(): string {
    return this.props.offerId;
  }
  get proposerId(): string {
    return this.props.proposerId;
  }
  get counterOfferId(): string | null {
    return this.props.counterOfferId;
  }
  get message(): string | null {
    return this.props.message;
  }
  get status(): ProposalStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get respondedAt(): Date | null {
    return this.props.respondedAt;
  }
}
