import { ProposalNotFoundError } from '../../../domain/errors/domain-errors.js';
import type { Clock } from '../../ports/clock.port.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { TradeProposalRepository } from '../../ports/trade-proposal-repository.port.js';
import { loadOffer } from './load-offer.js';
import type { ProposalView, ProposalViewAssembler } from './proposal-view.js';

export interface RejectProposalInput {
  proposalId: string;
  /** Debe ser el dueño de la oferta. */
  userId: string;
}

export class RejectProposalUseCase {
  constructor(
    private readonly proposals: TradeProposalRepository,
    private readonly offers: TradeOfferRepository,
    private readonly clock: Clock,
    private readonly views: ProposalViewAssembler,
  ) {}

  async execute(input: RejectProposalInput): Promise<ProposalView> {
    const proposal = await this.proposals.findById(input.proposalId);
    if (!proposal) {
      throw new ProposalNotFoundError();
    }
    const offer = await loadOffer(this.offers, proposal.offerId);
    proposal.reject(input.userId, offer, this.clock.now());
    await this.proposals.save(proposal);
    return this.views.toView(proposal, input.userId);
  }
}
