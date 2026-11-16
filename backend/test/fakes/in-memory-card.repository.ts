// Dueño: B (B4). Lo creó A en A3a.
import type { CardRepository } from '../../src/application/ports/card-repository.port.js';
import type { Page, PageRequest } from '../../src/application/ports/page.js';
import { Card } from '../../src/domain/entities/card.entity.js';
import type { CardCode } from '../../src/domain/value-objects/card-code.vo.js';
import { cloneCard, InMemoryStore, paginate } from './clone.js';

export class InMemoryCardRepository
  extends InMemoryStore<Card>
  implements CardRepository
{
  constructor() {
    super(cloneCard);
  }

  async findById(id: string): Promise<Card | null> {
    return this.get(id);
  }

  async findByCode(code: CardCode): Promise<Card | null> {
    return this.all().find((c) => c.code.equals(code)) ?? null;
  }

  async findByIds(ids: string[]): Promise<Card[]> {
    return this.all().filter((c) => ids.includes(c.id));
  }

  async search(q: PageRequest & { text?: string }): Promise<Page<Card>> {
    const text = q.text?.trim().toLowerCase();
    const matches = this.all()
      .filter(
        (c) =>
          !text ||
          c.name.toLowerCase().includes(text) ||
          c.code.value.toLowerCase().includes(text),
      )
      .sort((a, b) => a.code.value.localeCompare(b.code.value));
    return paginate(matches, q.page, q.pageSize);
  }

  async upsertMany(cards: Card[]): Promise<number> {
    for (const card of cards) {
      // Como en Prisma: el upsert por code conserva el id existente.
      const id = (await this.findByCode(card.code))?.id ?? card.id;
      this.put(
        Card.restore({
          id,
          code: card.code,
          name: card.name,
          setName: card.setName,
          rarity: card.rarity,
          color: card.color,
          cardType: card.cardType,
          imageUrl: card.imageUrl,
        }),
      );
    }
    return cards.length;
  }
}
