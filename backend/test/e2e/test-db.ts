import { PrismaService } from '../../src/infrastructure/prisma/prisma.service.js';

/** Cliente Prisma contra foilhub_test (DATABASE_URL lo fija vitest.config.e2e.ts). */
export async function connectTestDb(): Promise<PrismaService> {
  const prisma = new PrismaService();
  await prisma.$connect();
  return prisma;
}

/** Deja todas las tablas vacías. Llamar en beforeEach. */
export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE trade_proposals, trade_offers, cards, users RESTART IDENTITY CASCADE',
  );
}
