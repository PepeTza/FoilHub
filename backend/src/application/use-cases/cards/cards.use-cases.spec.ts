import {
  InMemoryCardRepository,
  SequentialIdGenerator,
} from '../../../../test/fakes/index.js';
import type {
  CardCatalogProvider,
  CatalogCard,
} from '../../ports/card-catalog-provider.port.js';
import { CardNotFoundError } from '../../../domain/errors/domain-errors.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import { GetCardByCodeUseCase } from './get-card-by-code.use-case.js';
import { ImportCardCatalogUseCase } from './import-card-catalog.use-case.js';
import { SearchCardsUseCase } from './search-cards.use-case.js';

class StubCatalogProvider implements CardCatalogProvider {
  constructor(private readonly items: CatalogCard[]) {}

  async fetchAll(): Promise<CatalogCard[]> {
    return this.items;
  }
}

const SAMPLE_CATALOG: CatalogCard[] = [
  {
    code: 'st1-03',
    name: ' Agumon ',
    setName: 'Starter Deck Gaia Red [ST-01]',
    rarity: 'U',
    color: 'Red',
    cardType: 'Digimon',
    imageUrl: 'https://images.digimoncard.io/images/cards/ST1-03.jpg',
  },
  {
    code: 'BT1-084',
    name: 'Omnimon',
    setName: 'Release Special Booster Ver.1.0 [BT01-03]',
    rarity: 'SR',
    color: 'White',
    cardType: 'Digimon',
    imageUrl: 'https://images.digimoncard.io/images/cards/BT1-084.jpg',
  },
  {
    code: 'ST2-03',
    name: 'Gabumon',
    setName: null,
    rarity: 'U',
    color: 'Blue',
    cardType: 'Digimon',
    imageUrl: null,
  },
  {
    code: 'CODIGO_INVALIDO',
    name: 'Carta inválida',
    setName: null,
    rarity: null,
    color: null,
    cardType: null,
    imageUrl: null,
  },
  {
    code: 'BT1-010',
    name: '   ',
    setName: null,
    rarity: null,
    color: null,
    cardType: null,
    imageUrl: null,
  },
];

function setup(catalog: CatalogCard[] = SAMPLE_CATALOG) {
  const cards = new InMemoryCardRepository();
  const ids = new SequentialIdGenerator('card');
  const provider = new StubCatalogProvider(catalog);
  return {
    cards,
    importCatalog: new ImportCardCatalogUseCase(provider, cards, ids),
    searchCards: new SearchCardsUseCase(cards),
    getCardByCode: new GetCardByCodeUseCase(cards),
  };
}

describe('ImportCardCatalogUseCase', () => {
  it('importa cartas válidas y omite las que tienen código o nombre inválido', async () => {
    const { importCatalog, cards } = setup();

    const result = await importCatalog.execute();

    expect(result).toEqual({ imported: 3, skipped: 2 });
    const stored = await cards.findByCode(CardCode.create('ST1-03'));
    expect(stored?.name).toBe('Agumon');
    expect(stored?.code.value).toBe('ST1-03');
  });

  it('hace upsert por code al reimportar sin duplicar cartas ni cambiar el id existente', async () => {
    const cards = new InMemoryCardRepository();
    const ids = new SequentialIdGenerator('card');

    const first = await new ImportCardCatalogUseCase(
      new StubCatalogProvider([SAMPLE_CATALOG[0], SAMPLE_CATALOG[1]]),
      cards,
      ids,
    ).execute();
    const initial = await cards.findByCode(CardCode.create('ST1-03'));

    const second = await new ImportCardCatalogUseCase(
      new StubCatalogProvider([
        { ...SAMPLE_CATALOG[0], name: 'Agumon (Actualizado)' },
        SAMPLE_CATALOG[1],
        SAMPLE_CATALOG[2],
      ]),
      cards,
      ids,
    ).execute();

    expect(first).toEqual({ imported: 2, skipped: 0 });
    expect(second).toEqual({ imported: 3, skipped: 0 });
    const all = await cards.search({ page: 1, pageSize: 50 });
    expect(all.total).toBe(3);
    const updated = await cards.findByCode(CardCode.create('ST1-03'));
    expect(updated?.id).toBe(initial?.id);
    expect(updated?.name).toBe('Agumon (Actualizado)');
  });
});

describe('SearchCardsUseCase', () => {
  it('busca por nombre o código sin distinguir mayúsculas y pagina resultados', async () => {
    const { importCatalog, searchCards } = setup();
    await importCatalog.execute();

    const byName = await searchCards.execute({ search: 'agu' });
    expect(byName.total).toBe(1);
    expect(byName.page).toBe(1);
    expect(byName.pageSize).toBe(20);
    expect(byName.items[0]).toMatchObject({ code: 'ST1-03', name: 'Agumon' });

    const byCode = await searchCards.execute({ search: 'bt1-084' });
    expect(byCode.total).toBe(1);
    expect(byCode.items[0].code).toBe('BT1-084');
  });

  it('limita pageSize a 50 como máximo', async () => {
    const { importCatalog, searchCards } = setup();
    await importCatalog.execute();

    const res = await searchCards.execute({ page: 1, pageSize: 200 });

    expect(res.pageSize).toBe(50);
  });
});

describe('GetCardByCodeUseCase', () => {
  it('devuelve el detalle de una carta existente normalizando el código', async () => {
    const { importCatalog, getCardByCode } = setup();
    await importCatalog.execute();

    const card = await getCardByCode.execute({ code: ' bt1-084 ' });

    expect(card).toMatchObject({
      code: 'BT1-084',
      name: 'Omnimon',
      rarity: 'SR',
    });
  });

  it('lanza CardNotFoundError cuando el código no existe o es inválido', async () => {
    const { getCardByCode } = setup();

    await expect(getCardByCode.execute({ code: 'BT9-999' })).rejects.toThrow(
      CardNotFoundError,
    );
    await expect(
      getCardByCode.execute({ code: 'no-valido' }),
    ).rejects.toThrow(CardNotFoundError);
  });
});
