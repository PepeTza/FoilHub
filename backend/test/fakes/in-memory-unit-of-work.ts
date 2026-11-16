import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../src/application/ports/unit-of-work.port.js';
import type { InMemoryTradeOfferRepository } from './in-memory-trade-offer.repository.js';
import type { InMemoryTradeProposalRepository } from './in-memory-trade-proposal.repository.js';

/** Si `work` lanza, deshace los cambios en ofertas y propuestas (como un rollback). */
export class InMemoryUnitOfWork implements UnitOfWork {
  runs = 0;

  constructor(
    private readonly offers: InMemoryTradeOfferRepository,
    private readonly proposals: InMemoryTradeProposalRepository,
  ) {}

  async run<T>(
    work: (repos: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    this.runs++;
    const offersBefore = this.offers.snapshot();
    const proposalsBefore = this.proposals.snapshot();
    try {
      return await work({ offers: this.offers, proposals: this.proposals });
    } catch (error) {
      this.offers.restoreSnapshot(offersBefore);
      this.proposals.restoreSnapshot(proposalsBefore);
      throw error;
    }
  }
}
