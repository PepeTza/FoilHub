import { Card } from '../../../domain/entities/card.entity.js';
import { InvalidCardCodeError } from '../../../domain/errors/domain-errors.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import type { CardCatalogProvider } from '../../ports/card-catalog-provider.port.js';
import type { CardRepository } from '../../ports/card-repository.port.js';
import type { IdGenerator } from '../../ports/id-generator.port.js';

export interface ImportCardCatalogOutput {
  imported: number;
  skipped: number;
}

export class ImportCardCatalogUseCase {
  constructor(
    private readonly catalogProvider: CardCatalogProvider,
    private readonly cards: CardRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(): Promise<ImportCardCatalogOutput> {
    const rawCards = await this.catalogProvider.fetchAll();
    const cardsByCode = new Map<string, Card>();
    let skipped = 0;

    for (const raw of rawCards) {
      const name = raw.name.trim();
      if (!name) {
        skipped += 1;
        continue;
      }

      let code: CardCode;
      try {
        code = CardCode.create(raw.code);
      } catch (error) {
        if (error instanceof InvalidCardCodeError) {
          skipped += 1;
          continue;
        }
        throw error;
      }

      cardsByCode.set(
        code.value,
        Card.create({
          id: this.ids.next(),
          code,
          name,
          setName: normalizeOptional(raw.setName),
          rarity: normalizeOptional(raw.rarity),
          color: normalizeOptional(raw.color),
          cardType: normalizeOptional(raw.cardType),
          imageUrl: normalizeOptional(raw.imageUrl),
        }),
      );
    }

    const validCards = Array.from(cardsByCode.values());
    const imported =
      validCards.length > 0 ? await this.cards.upsertMany(validCards) : 0;

    return { imported, skipped };
  }
}

function normalizeOptional(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
