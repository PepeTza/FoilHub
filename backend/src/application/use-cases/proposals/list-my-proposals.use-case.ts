import type { ProposalStatus } from '../../../domain/entities/trade-proposal.entity.js';
import type {
  ProposalBox,
  TradeProposalRepository,
} from '../../ports/trade-proposal-repository.port.js';
import type { ProposalView, ProposalViewAssembler } from './proposal-view.js';

export interface ListMyProposalsInput {
  userId: string;
  /** received: las que llegaron a mis ofertas; sent: las que hice yo. */
  box: ProposalBox;
  status?: ProposalStatus;
}

export class ListMyProposalsUseCase {
  constructor(
    private readonly proposals: TradeProposalRepository,
    private readonly views: ProposalViewAssembler,
  ) {}

  async execute(input: ListMyProposalsInput): Promise<ProposalView[]> {
    const proposals = await this.proposals.listForUser(input);
    return this.views.toViews(proposals, input.userId);
  }
}
