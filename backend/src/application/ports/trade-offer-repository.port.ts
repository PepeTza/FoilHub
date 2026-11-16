import type {
  OfferStatus,
  TradeOffer,
} from '../../domain/entities/trade-offer.entity.js';
import type { Page, PageRequest } from './page.js';

export interface ListOpenOffersQuery extends PageRequest {
  offeredCardId?: string;
  wantedCardId?: string;
  excludeOwnerId?: string;
}

export interface TradeOfferRepository {
  findById(id: string): Promise<TradeOffer | null>;
  listOpen(q: ListOpenOffersQuery): Promise<Page<TradeOffer>>;
  listByOwner(ownerId: string, status?: OfferStatus): Promise<TradeOffer[]>;
  /** Solo acota candidatos (OPEN, cartas invertidas, otro dueño); decide TradeMatcher. */
  findMatchCandidates(offer: TradeOffer): Promise<TradeOffer[]>;
  /**
   * Insert o update. Al pasar de OPEN a otro estado actualiza solo si en la BD
   * sigue OPEN; si no, lanza ConcurrencyConflictError.
   */
  save(offer: TradeOffer): Promise<void>;
}
