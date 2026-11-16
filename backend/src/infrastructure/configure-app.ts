import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainExceptionFilter } from '../interface-adapters/http/filters/domain-exception.filter.js';

/** Configuración común a main.ts y a los tests e2e. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
