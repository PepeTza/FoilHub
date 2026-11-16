import type { Page } from '../../../application/ports/page.js';
import type {
  ListOpenOffersQuery,
  TradeOfferRepository,
} from '../../../application/ports/trade-offer-repository.port.js';
import type {
  OfferStatus,
  TradeOffer,
} from '../../../domain/entities/trade-offer.entity.js';
import { ConcurrencyConflictError } from '../../../domain/errors/domain-errors.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { TradeOfferMapper } from '../mappers/trade-offer.mapper.js';
import { isUuid, type PrismaDb } from '../prisma-db.js';

const NEWEST_FIRST = [
  { createdAt: 'desc' },
  { id: 'asc' },
] satisfies Prisma.TradeOfferOrderByWithRelationInput[];

export class PrismaTradeOfferRepository implements TradeOfferRepository {
  constructor(private readonly db: PrismaDb) {}

  async findById(id: string): Promise<TradeOffer | null> {
    if (!isUuid(id)) {
      return null;
    }
    const row = await this.db.tradeOffer.findUnique({ where: { id } });
    return row ? TradeOfferMapper.toDomain(row) : null;
  }

  async listOpen(q: ListOpenOffersQuery): Promise<Page<TradeOffer>> {
    const where: Prisma.TradeOfferWhereInput = {
      status: 'OPEN',
      offeredCardId: q.offeredCardId,
      wantedCardId: q.wantedCardId,
      ownerId: q.excludeOwnerId ? { not: q.excludeOwnerId } : undefined,
    };
    const [rows, total] = await Promise.all([
      this.db.tradeOffer.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.tradeOffer.count({ where }),
    ]);
    return {
      items: rows.map((row) => TradeOfferMapper.toDomain(row)),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }

  async listByOwner(
    ownerId: string,
    status?: OfferStatus,
  ): Promise<TradeOffer[]> {
    const rows = await this.db.tradeOffer.findMany({
      where: { ownerId, status },
      orderBy: NEWEST_FIRST,
    });
    return rows.map((row) => TradeOfferMapper.toDomain(row));
  }

  async findMatchCandidates(offer: TradeOffer): Promise<TradeOffer[]> {
    const rows = await this.db.tradeOffer.findMany({
      where: {
        status: 'OPEN',
        ownerId: { not: offer.ownerId },
        offeredCardId: offer.wantedCardId,
        wantedCardId: offer.offeredCardId,
      },
      orderBy: NEWEST_FIRST,
    });
    return rows.map((row) => TradeOfferMapper.toDomain(row));
  }

  async save(offer: TradeOffer): Promise<void> {
    const data = TradeOfferMapper.toPersistence(offer);
    if (offer.isOpen) {
      await this.db.tradeOffer.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });
      return;
    }

    // Cierre optimista: solo gana quien la encuentre todavía OPEN. Con dos transacciones a la vez,
    // la segunda espera el bloqueo de la fila, reevalúa el WHERE y actualiza 0 filas.
    const { count } = await this.db.tradeOffer.updateMany({
      where: { id: data.id, status: 'OPEN' },
      data: { status: data.status, closedAt: data.closedAt },
    });
    if (count === 0) {
      throw new ConcurrencyConflictError();
    }
  }
}
