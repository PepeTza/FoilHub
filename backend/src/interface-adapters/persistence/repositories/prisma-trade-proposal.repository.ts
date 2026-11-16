import type {
  ListProposalsQuery,
  TradeProposalRepository,
} from '../../../application/ports/trade-proposal-repository.port.js';
import type { TradeProposal } from '../../../domain/entities/trade-proposal.entity.js';
import { DuplicateProposalError } from '../../../domain/errors/domain-errors.js';
import { TradeProposalMapper } from '../mappers/trade-proposal.mapper.js';
import { isUniqueViolation, type PrismaDb } from '../prisma-db.js';

export class PrismaTradeProposalRepository implements TradeProposalRepository {
  constructor(private readonly db: PrismaDb) {}

  async findById(id: string): Promise<TradeProposal | null> {
    const row = await this.db.tradeProposal.findUnique({ where: { id } });
    return row ? TradeProposalMapper.toDomain(row) : null;
  }

  async findPendingByOffer(offerId: string): Promise<TradeProposal[]> {
    const rows = await this.db.tradeProposal.findMany({
      where: { offerId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => TradeProposalMapper.toDomain(row));
  }

  async existsPending(offerId: string, proposerId: string): Promise<boolean> {
    const count = await this.db.tradeProposal.count({
      where: { offerId, proposerId, status: 'PENDING' },
    });
    return count > 0;
  }

  async listForUser(q: ListProposalsQuery): Promise<TradeProposal[]> {
    const rows = await this.db.tradeProposal.findMany({
      where: {
        status: q.status,
        ...(q.box === 'sent'
          ? { proposerId: q.userId }
          : { offer: { ownerId: q.userId } }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return rows.map((row) => TradeProposalMapper.toDomain(row));
  }

  async save(proposal: TradeProposal): Promise<void> {
    const data = TradeProposalMapper.toPersistence(proposal);
    try {
      await this.db.tradeProposal.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });
    } catch (error) {
      // Índice parcial trade_proposals_one_pending: dos propuestas simultáneas del mismo usuario.
      if (isUniqueViolation(error)) {
        throw new DuplicateProposalError();
      }
      throw error;
    }
  }

  async saveMany(proposals: TradeProposal[]): Promise<void> {
    for (const proposal of proposals) {
      await this.save(proposal);
    }
  }
}
