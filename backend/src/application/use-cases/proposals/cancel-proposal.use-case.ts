import { ProposalNotFoundError } from '../../../domain/errors/domain-errors.js';
import type { Clock } from '../../ports/clock.port.js';
import type { TradeProposalRepository } from '../../ports/trade-proposal-repository.port.js';
import type { ProposalView, ProposalViewAssembler } from './proposal-view.js';

export interface CancelProposalInput {
  proposalId: string;
  /** Debe ser el proponente. */
  userId: string;
}

export class CancelProposalUseCase {
  constructor(
    private readonly proposals: TradeProposalRepository,
    private readonly clock: Clock,
    private readonly views: ProposalViewAssembler,
  ) {}

  async execute(input: CancelProposalInput): Promise<ProposalView> {
    const proposal = await this.proposals.findById(input.proposalId);
    if (!proposal) {
      throw new ProposalNotFoundError();
    }
    proposal.cancel(input.userId, this.clock.now());
    await this.proposals.save(proposal);
    return this.views.toView(proposal, input.userId);
  }
}
