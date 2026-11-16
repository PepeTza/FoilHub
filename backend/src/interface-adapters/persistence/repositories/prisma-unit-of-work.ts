import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../../application/ports/unit-of-work.port.js';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaTradeOfferRepository } from './prisma-trade-offer.repository.js';
import { PrismaTradeProposalRepository } from './prisma-trade-proposal.repository.js';

/** Interactive transaction de Prisma: si `work` lanza, se hace rollback de todo. */
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) =>
      work({
        offers: new PrismaTradeOfferRepository(tx),
        proposals: new PrismaTradeProposalRepository(tx),
      }),
    );
  }
}
