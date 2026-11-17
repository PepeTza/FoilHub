import type {
  ListProposalsQuery,
  TradeProposalRepository,
} from '../../src/application/ports/trade-proposal-repository.port.js';
import type { TradeProposal } from '../../src/domain/entities/trade-proposal.entity.js';
import { ConcurrencyConflictError } from '../../src/domain/errors/domain-errors.js';
import { cloneProposal, InMemoryStore } from './clone.js';
import type { InMemoryTradeOfferRepository } from './in-memory-trade-offer.repository.js';

export class InMemoryTradeProposalRepository
  extends InMemoryStore<TradeProposal>
  implements TradeProposalRepository
{
  /** Necesita las ofertas para saber qué propuestas "recibió" un usuario. */
  constructor(private readonly offers: InMemoryTradeOfferRepository) {
    super(cloneProposal);
  }

  async findById(id: string): Promise<TradeProposal | null> {
    return this.get(id);
  }

  async findPendingByOffer(offerId: string): Promise<TradeProposal[]> {
    return this.all().filter((p) => p.offerId === offerId && p.isPending);
  }

  async existsPending(offerId: string, proposerId: string): Promise<boolean> {
    return this.all().some(
      (p) =>
        p.offerId === offerId && p.proposerId === proposerId && p.isPending,
    );
  }

  async listForUser(q: ListProposalsQuery): Promise<TradeProposal[]> {
    const mine: TradeProposal[] = [];
    for (const p of this.all()) {
      const belongs =
        q.box === 'sent'
          ? p.proposerId === q.userId
          : (await this.offers.findById(p.offerId))?.ownerId === q.userId;
      if (belongs && (!q.status || p.status === q.status)) {
        mine.push(p);
      }
    }
    return mine.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** Igual que el repo Prisma: responder una propuesta que ya no está PENDING es un conflicto. */
  async save(proposal: TradeProposal): Promise<void> {
    if (!proposal.isPending && !this.rows.get(proposal.id)?.isPending) {
      throw new ConcurrencyConflictError();
    }
    this.put(proposal);
  }

  async saveMany(proposals: TradeProposal[]): Promise<void> {
    for (const proposal of proposals) {
      await this.save(proposal);
    }
  }
}
