import {
  NotOfferOwnerError,
  OfferNotOpenError,
  SameCardTradeError,
} from '../errors/domain-errors.js';
import type { Quantity } from '../value-objects/quantity.vo.js';

export const OFFER_STATUSES = ['OPEN', 'COMPLETED', 'CANCELLED'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export interface TradeOfferProps {
  id: string;
  ownerId: string;
  offeredCardId: string;
  offeredQuantity: Quantity;
  wantedCardId: string;
  wantedQuantity: Quantity;
  status: OfferStatus;
  createdAt: Date;
  closedAt: Date | null;
}

export type NewTradeOfferProps = Omit<TradeOfferProps, 'status' | 'closedAt'>;

/** "Doy N de la carta X, quiero M de la carta Y". OPEN → COMPLETED | CANCELLED. */
export class TradeOffer {
  private constructor(private readonly props: TradeOfferProps) {}

  static create(props: NewTradeOfferProps): TradeOffer {
    if (props.offeredCardId === props.wantedCardId) {
      throw new SameCardTradeError();
    }
    return new TradeOffer({ ...props, status: 'OPEN', closedAt: null });
  }

  static restore(props: TradeOfferProps): TradeOffer {
    return new TradeOffer({ ...props });
  }

  /** Solo el dueño, solo si está OPEN. */
  cancel(byUserId: string, at: Date): void {
    if (!this.isOwnedBy(byUserId)) {
      throw new NotOfferOwnerError();
    }
    this.close('CANCELLED', at);
  }

  /** Se acepta una propuesta sobre esta oferta (o la usa como contraoferta). */
  complete(at: Date): void {
    this.close('COMPLETED', at);
  }

  isOwnedBy(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  get isOpen(): boolean {
    return this.props.status === 'OPEN';
  }

  private close(status: Exclude<OfferStatus, 'OPEN'>, at: Date): void {
    if (!this.isOpen) {
      throw new OfferNotOpenError();
    }
    this.props.status = status;
    this.props.closedAt = at;
  }

  get id(): string {
    return this.props.id;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get offeredCardId(): string {
    return this.props.offeredCardId;
  }
  get offeredQuantity(): Quantity {
    return this.props.offeredQuantity;
  }
  get wantedCardId(): string {
    return this.props.wantedCardId;
  }
  get wantedQuantity(): Quantity {
    return this.props.wantedQuantity;
  }
  get status(): OfferStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get closedAt(): Date | null {
    return this.props.closedAt;
  }
}
