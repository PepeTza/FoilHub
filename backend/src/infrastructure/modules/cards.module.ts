import { Module } from '@nestjs/common';
import type { CardCatalogProvider } from '../../application/ports/card-catalog-provider.port.js';
import type { CardRepository } from '../../application/ports/card-repository.port.js';
import type { IdGenerator } from '../../application/ports/id-generator.port.js';
import { GetCardByCodeUseCase } from '../../application/use-cases/cards/get-card-by-code.use-case.js';
import { ImportCardCatalogUseCase } from '../../application/use-cases/cards/import-card-catalog.use-case.js';
import { SearchCardsUseCase } from '../../application/use-cases/cards/search-cards.use-case.js';
import {
  CARD_CATALOG_PROVIDER,
  CARD_REPOSITORY,
  ID_GENERATOR,
} from '../../interface-adapters/di-tokens.js';
import { CardsController } from '../../interface-adapters/http/controllers/cards.controller.js';
import { PrismaCardRepository } from '../../interface-adapters/persistence/repositories/prisma-card.repository.js';
import { DigimonCardIoCatalogProvider } from '../external/digimon-card-io-catalog.provider.js';
import { JsonFileCatalogProvider } from '../external/json-file-catalog.provider.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Catálogo de cartas. Exporta CARD_REPOSITORY para que OffersModule (A6) lo reutilice. */
@Module({
  controllers: [CardsController],
  providers: [
    {
      provide: CARD_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaCardRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CARD_CATALOG_PROVIDER,
      useFactory: (): CardCatalogProvider => {
        const source = process.env.CARD_CATALOG_SOURCE ?? 'file';
        if (source === 'digimoncardio') {
          return new DigimonCardIoCatalogProvider();
        }
        if (source === 'file') {
          return new JsonFileCatalogProvider();
        }
        throw new Error(
          `CARD_CATALOG_SOURCE inválido: "${source}" (usa "file" o "digimoncardio")`,
        );
      },
    },
    {
      provide: SearchCardsUseCase,
      useFactory: (cards: CardRepository) => new SearchCardsUseCase(cards),
      inject: [CARD_REPOSITORY],
    },
    {
      provide: GetCardByCodeUseCase,
      useFactory: (cards: CardRepository) => new GetCardByCodeUseCase(cards),
      inject: [CARD_REPOSITORY],
    },
    {
      provide: ImportCardCatalogUseCase,
      useFactory: (
        catalogProvider: CardCatalogProvider,
        cards: CardRepository,
        ids: IdGenerator,
      ) => new ImportCardCatalogUseCase(catalogProvider, cards, ids),
      inject: [CARD_CATALOG_PROVIDER, CARD_REPOSITORY, ID_GENERATOR],
    },
  ],
  exports: [CARD_REPOSITORY, ImportCardCatalogUseCase],
})
export class CardsModule {}
