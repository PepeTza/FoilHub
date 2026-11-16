import type { Card } from '../../domain/entities/card.entity.js';
import type { CardCode } from '../../domain/value-objects/card-code.vo.js';
import type { Page, PageRequest } from './page.js';

export interface CardRepository {
  findById(id: string): Promise<Card | null>;
  findByCode(code: CardCode): Promise<Card | null>;
  findByIds(ids: string[]): Promise<Card[]>;
  /** Busca por nombre o código, sin distinguir mayúsculas. */
  search(q: PageRequest & { text?: string }): Promise<Page<Card>>;
  /** Upsert por `code`. Devuelve cuántas cartas se escribieron. */
  upsertMany(cards: Card[]): Promise<number>;
}
