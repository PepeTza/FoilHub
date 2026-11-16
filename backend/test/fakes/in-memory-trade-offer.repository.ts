import type { Page } from '../../src/application/ports/page.js';
import type {
  ListOpenOffersQuery,
  TradeOfferRepository,
} from '../../src/application/ports/trade-offer-repository.port.js';
import type {
  OfferStatus,
  TradeOffer,
} from '../../src/domain/entities/trade-offer.entity.js';
import { ConcurrencyConflictError } from '../../src/domain/errors/domain-errors.js';
import { cloneOffer, InMemoryStore, paginate } from './clone.js';

const newestFirst = (a: TradeOffer, b: TradeOffer) =>
  b.createdAt.getTime() - a.createdAt.getTime();

export class InMemoryTradeOfferRepository
  extends InMemoryStore<TradeOffer>
  implements TradeOfferRepository
{
  constructor() {
    super(cloneOffer);
  }

  async findById(id: string): Promise<TradeOffer | null> {
    return this.get(id);
  }

  async listOpen(q: ListOpenOffersQuery): Promise<Page<TradeOffer>> {
    const items = this.all()
      .filter(
        (o) =>
          o.isOpen &&
          (!q.offeredCardId || o.offeredCardId === q.offeredCardId) &&
          (!q.wantedCardId || o.wantedCardId === q.wantedCardId) &&
          (!q.excludeOwnerId || o.ownerId !== q.excludeOwnerId),
      )
      .sort(newestFirst);
    return paginate(items, q.page, q.pageSize);
  }

  async listByOwner(
    ownerId: string,
    status?: OfferStatus,
  ): Promise<TradeOffer[]> {
    return this.all()
      .filter((o) => o.ownerId === ownerId && (!status || o.status === status))
      .sort(newestFirst);
  }

  async findMatchCandidates(offer: TradeOffer): Promise<TradeOffer[]> {
    return this.all().filter(
      (o) =>
        o.isOpen &&
        o.ownerId !== offer.ownerId &&
        o.offeredCardId === offer.wantedCardId &&
        o.wantedCardId === offer.offeredCardId,
    );
  }

  /**
   * Igual que el repo Prisma (`updateMany where status = 'OPEN'`): una oferta que en la
   * "BD" ya está cerrada no se vuelve a escribir, aunque el nuevo estado sea el mismo.
   */
  async save(offer: TradeOffer): Promise<void> {
    const stored = this.rows.get(offer.id);
    if (stored && !stored.isOpen) {
      throw new ConcurrencyConflictError();
    }
    this.put(offer);
  }
}
