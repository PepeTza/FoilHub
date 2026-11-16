import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { configureApp } from '../../src/infrastructure/configure-app.js';
import { AppModule } from '../../src/infrastructure/modules/app.module.js';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service.js';

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
}

/** La app completa contra foilhub_test, con la misma configuración que main.ts. */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}
