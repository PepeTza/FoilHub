import { Global, Module } from '@nestjs/common';
import {
  CLOCK,
  ID_GENERATOR,
  TRADE_OFFER_REPOSITORY,
  TRADE_PROPOSAL_REPOSITORY,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../../interface-adapters/di-tokens.js';
import { PrismaTradeOfferRepository } from '../../interface-adapters/persistence/repositories/prisma-trade-offer.repository.js';
import { PrismaTradeProposalRepository } from '../../interface-adapters/persistence/repositories/prisma-trade-proposal.repository.js';
import { PrismaUnitOfWork } from '../../interface-adapters/persistence/repositories/prisma-unit-of-work.js';
import { PrismaUserRepository } from '../../interface-adapters/persistence/repositories/prisma-user.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CryptoIdGenerator } from '../system/crypto-id-generator.js';
import { SystemClock } from '../system/system-clock.js';

/**
 * Piezas compartidas por todos los módulos. El repositorio de cartas NO va aquí:
 * lo provee y exporta CardsModule (B4).
 */
@Global()
@Module({
  providers: [
    PrismaService,
    { provide: ID_GENERATOR, useValue: new CryptoIdGenerator() },
    { provide: CLOCK, useValue: new SystemClock() },
    {
      provide: USER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaUserRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: TRADE_OFFER_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaTradeOfferRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: TRADE_PROPOSAL_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaTradeProposalRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: UNIT_OF_WORK,
      useFactory: (prisma: PrismaService) => new PrismaUnitOfWork(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [
    PrismaService,
    ID_GENERATOR,
    CLOCK,
    USER_REPOSITORY,
    TRADE_OFFER_REPOSITORY,
    TRADE_PROPOSAL_REPOSITORY,
    UNIT_OF_WORK,
  ],
})
export class CoreModule {}
