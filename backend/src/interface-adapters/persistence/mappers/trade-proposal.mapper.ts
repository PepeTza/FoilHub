import { TradeProposal } from '../../../domain/entities/trade-proposal.entity.js';
import type { TradeProposal as TradeProposalRow } from '../../../generated/prisma/client.js';

export const TradeProposalMapper = {
  toDomain(row: TradeProposalRow): TradeProposal {
    return TradeProposal.restore({
      id: row.id,
      offerId: row.offerId,
      proposerId: row.proposerId,
      counterOfferId: row.counterOfferId,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      respondedAt: row.respondedAt,
    });
  },

  toPersistence(proposal: TradeProposal): TradeProposalRow {
    return {
      id: proposal.id,
      offerId: proposal.offerId,
      proposerId: proposal.proposerId,
      counterOfferId: proposal.counterOfferId,
      message: proposal.message,
      status: proposal.status,
      createdAt: proposal.createdAt,
      respondedAt: proposal.respondedAt,
    };
  },
};
