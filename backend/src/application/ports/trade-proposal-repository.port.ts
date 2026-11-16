import type {
  ProposalStatus,
  TradeProposal,
} from '../../domain/entities/trade-proposal.entity.js';

export type ProposalBox = 'sent' | 'received';

export interface ListProposalsQuery {
  userId: string;
  /** sent: las que hizo el usuario; received: las que llegaron a sus ofertas. */
  box: ProposalBox;
  status?: ProposalStatus;
}

export interface TradeProposalRepository {
  findById(id: string): Promise<TradeProposal | null>;
  findPendingByOffer(offerId: string): Promise<TradeProposal[]>;
  existsPending(offerId: string, proposerId: string): Promise<boolean>;
  listForUser(q: ListProposalsQuery): Promise<TradeProposal[]>;
  save(proposal: TradeProposal): Promise<void>;
  saveMany(proposals: TradeProposal[]): Promise<void>;
}
