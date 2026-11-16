// Los fakes guardan copias: así una entidad modificada sin save() no cambia el "estado de la BD",
// igual que con Prisma.
import { Card } from '../../src/domain/entities/card.entity.js';
import { TradeOffer } from '../../src/domain/entities/trade-offer.entity.js';
import { TradeProposal } from '../../src/domain/entities/trade-proposal.entity.js';
import { User } from '../../src/domain/entities/user.entity.js';

export const cloneUser = (u: User): User =>
  User.restore({
    id: u.id,
    username: u.username,
    passwordHash: u.passwordHash,
    contactInfo: u.contactInfo,
    createdAt: u.createdAt,
  });

export const cloneCard = (c: Card): Card =>
  Card.restore({
    id: c.id,
    code: c.code,
    name: c.name,
    setName: c.setName,
    rarity: c.rarity,
    color: c.color,
    cardType: c.cardType,
    imageUrl: c.imageUrl,
  });

export const cloneOffer = (o: TradeOffer): TradeOffer =>
  TradeOffer.restore({
    id: o.id,
    ownerId: o.ownerId,
    offeredCardId: o.offeredCardId,
    offeredQuantity: o.offeredQuantity,
    wantedCardId: o.wantedCardId,
    wantedQuantity: o.wantedQuantity,
    status: o.status,
    createdAt: o.createdAt,
    closedAt: o.closedAt,
  });

export const cloneProposal = (p: TradeProposal): TradeProposal =>
  TradeProposal.restore({
    id: p.id,
    offerId: p.offerId,
    proposerId: p.proposerId,
    counterOfferId: p.counterOfferId,
    message: p.message,
    status: p.status,
    createdAt: p.createdAt,
    respondedAt: p.respondedAt,
  });

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

/** Repositorio en memoria con snapshot/rollback para InMemoryUnitOfWork. */
export abstract class InMemoryStore<T extends { id: string }> {
  protected rows = new Map<string, T>();

  constructor(private readonly clone: (row: T) => T) {}

  /** Para preparar datos en un test. */
  seed(...rows: T[]): this {
    for (const row of rows) {
      this.rows.set(row.id, this.clone(row));
    }
    return this;
  }

  snapshot(): Map<string, T> {
    return new Map([...this.rows].map(([id, row]) => [id, this.clone(row)]));
  }

  restoreSnapshot(snapshot: Map<string, T>): void {
    this.rows = snapshot;
  }

  protected all(): T[] {
    return [...this.rows.values()].map(this.clone);
  }

  protected get(id: string): T | null {
    const row = this.rows.get(id);
    return row ? this.clone(row) : null;
  }

  protected put(row: T): void {
    this.rows.set(row.id, this.clone(row));
  }
}
