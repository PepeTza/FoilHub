import '../config/load-env.js';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ImportCardCatalogUseCase } from '../../application/use-cases/cards/import-card-catalog.use-case.js';
import { CardsModule } from '../modules/cards.module.js';
import { CoreModule } from '../modules/core.module.js';

@Module({
  imports: [CoreModule, CardsModule],
})
class ImportCardsCliModule {}

const logger = new Logger('ImportCards');

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(ImportCardsCliModule);
  try {
    const importCatalog = app.get(ImportCardCatalogUseCase);
    const result = await importCatalog.execute();
    logger.log(`Catálogo importado: ${JSON.stringify(result)}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  logger.error(
    'Error al importar el catálogo de cartas',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
