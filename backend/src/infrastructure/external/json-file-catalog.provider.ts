import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  CardCatalogProvider,
  CatalogCard,
} from '../../application/ports/card-catalog-provider.port.js';

function defaultSeedPath(): string {
  const fromCwd = path.resolve(process.cwd(), 'prisma/seed/cards.sample.json');
  if (existsSync(fromCwd)) {
    return fromCwd;
  }
  return path.resolve(
    import.meta.dirname,
    '../../../prisma/seed/cards.sample.json',
  );
}

export class JsonFileCatalogProvider implements CardCatalogProvider {
  constructor(private readonly filePath: string = defaultSeedPath()) {}

  async fetchAll(): Promise<CatalogCard[]> {
    const raw = await readFile(this.filePath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(
        `El archivo de catálogo ${this.filePath} debe contener un arreglo JSON`,
      );
    }

    return parsed.map((item) => toCatalogCard(item));
  }
}

function toCatalogCard(item: unknown): CatalogCard {
  if (typeof item !== 'object' || item === null) {
    return {
      code: '',
      name: '',
      setName: null,
      rarity: null,
      color: null,
      cardType: null,
      imageUrl: null,
    };
  }
  const record = item as Record<string, unknown>;
  return {
    code: asString(record.code),
    name: asString(record.name),
    setName: asNullableString(record.setName),
    rarity: asNullableString(record.rarity),
    color: asNullableString(record.color),
    cardType: asNullableString(record.cardType),
    imageUrl: asNullableString(record.imageUrl),
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}
