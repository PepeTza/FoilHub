import type { CardRepository } from '../../../application/ports/card-repository.port.js';
import type { Page, PageRequest } from '../../../application/ports/page.js';
import type { Card } from '../../../domain/entities/card.entity.js';
import type { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { CardMapper } from '../mappers/card.mapper.js';
import type { PrismaDb } from '../prisma-db.js';

const UPSERT_BATCH_SIZE = 50;
const BY_CODE_ASC = [
  { code: 'asc' },
] satisfies Prisma.CardOrderByWithRelationInput[];

export class PrismaCardRepository implements CardRepository {
  constructor(private readonly db: PrismaDb) {}

  async findById(id: string): Promise<Card | null> {
    const row = await this.db.card.findUnique({ where: { id } });
    return row ? CardMapper.toDomain(row) : null;
  }

  async findByCode(code: CardCode): Promise<Card | null> {
    const row = await this.db.card.findUnique({ where: { code: code.value } });
    return row ? CardMapper.toDomain(row) : null;
  }

  async findByIds(ids: string[]): Promise<Card[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db.card.findMany({ where: { id: { in: ids } } });
    return rows.map((row) => CardMapper.toDomain(row));
  }

  async search(q: PageRequest & { text?: string }): Promise<Page<Card>> {
    const text = q.text?.trim();
    const where: Prisma.CardWhereInput = text
      ? {
          OR: [
            { name: { contains: text, mode: 'insensitive' } },
            { code: { contains: text, mode: 'insensitive' } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.db.card.findMany({
        where,
        orderBy: BY_CODE_ASC,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.card.count({ where }),
    ]);

    return {
      items: rows.map((row) => CardMapper.toDomain(row)),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }

  async upsertMany(cards: Card[]): Promise<number> {
    for (let i = 0; i < cards.length; i += UPSERT_BATCH_SIZE) {
      const batch = cards.slice(i, i + UPSERT_BATCH_SIZE);
      await Promise.all(
        batch.map((card) => {
          const data = CardMapper.toPersistence(card);
          return this.db.card.upsert({
            where: { code: data.code },
            create: data,
            update: {
              name: data.name,
              setName: data.setName,
              rarity: data.rarity,
              color: data.color,
              cardType: data.cardType,
              imageUrl: data.imageUrl,
            },
          });
        }),
      );
    }
    return cards.length;
  }
}
