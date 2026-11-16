import type {
  CardCatalogProvider,
  CatalogCard,
} from '../../application/ports/card-catalog-provider.port.js';

const DEFAULT_API_URL =
  'https://digimoncard.io/api-public/search.php?series=Digimon%20Card%20Game';

export class DigimonCardIoCatalogProvider implements CardCatalogProvider {
  constructor(private readonly apiUrl: string = DEFAULT_API_URL) {}

  async fetchAll(): Promise<CatalogCard[]> {
    const response = await fetch(this.apiUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Error al consultar digimoncard.io (${response.status} ${response.statusText})`,
      );
    }

    const parsed: unknown = await response.json();
    if (!Array.isArray(parsed)) {
      throw new Error(
        'La respuesta de digimoncard.io no tiene el formato de arreglo esperado',
      );
    }

    return parsed.map((item) => mapExternalCard(item));
  }
}

function mapExternalCard(item: unknown): CatalogCard {
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
  const code = firstString(record.id, record.cardnumber, record.code);
  const name = firstString(record.name);
  const setName = firstNullableString(record.set_name, record.setName);
  const rarity = firstNullableString(record.rarity, record.cardrarity);
  const color = firstNullableString(record.color);
  const cardType = firstNullableString(record.type, record.cardType);
  const rawImageUrl = firstNullableString(record.image_url, record.imageUrl);
  const imageUrl =
    rawImageUrl ??
    (code
      ? `https://images.digimoncard.io/images/cards/${code.trim().toUpperCase()}.jpg`
      : null);

  return {
    code,
    name,
    setName,
    rarity,
    color,
    cardType,
    imageUrl,
  };
}

function firstString(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return '';
}

function firstNullableString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
    if (Array.isArray(candidate)) {
      const first = candidate.find(
        (entry): entry is string =>
          typeof entry === 'string' && entry.trim().length > 0,
      );
      if (first) {
        return first.trim();
      }
    }
  }
  return null;
}
