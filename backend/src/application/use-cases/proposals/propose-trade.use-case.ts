import { TradeProposal } from '../../../domain/entities/trade-proposal.entity.js';
import {
  CounterOfferNotMatchingError,
  DuplicateProposalError,
  OfferNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import type { Clock } from '../../ports/clock.port.js';
import type { IdGenerator } from '../../ports/id-generator.port.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { TradeProposalRepository } from '../../ports/trade-proposal-repository.port.js';
import type { ProposalView, ProposalViewAssembler } from './proposal-view.js';

export interface ProposeTradeInput {
  offerId: string;
  proposerId: string;
  /** Oferta propia que es la inversa exacta de `offerId` (opcional). */
  counterOfferId?: string | null;
  message?: string | null;
}

export class ProposeTradeUseCase {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly proposals: TradeProposalRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly views: ProposalViewAssembler,
  ) {}

  async execute(input: ProposeTradeInput): Promise<ProposalView> {
    const offer = await this.offers.findById(input.offerId);
    if (!offer) {
      throw new OfferNotFoundError();
    }
    const counterOffer = input.counterOfferId
      ? await this.offers.findById(input.counterOfferId)
      : null;
    if (input.counterOfferId && !counterOffer) {
      throw new CounterOfferNotMatchingError();
    }

    // El dominio valida self-trade, oferta OPEN y que la contraoferta haga match.
    const proposal = TradeProposal.create({
      id: this.ids.next(),
      offer,
      proposerId: input.proposerId,
      counterOffer,
      message: input.message ?? null,
      createdAt: this.clock.now(),
    });
    // Si dos llegan a la vez, el índice único parcial es la última barrera (el repo lo traduce).
    if (await this.proposals.existsPending(offer.id, input.proposerId)) {
      throw new DuplicateProposalError();
    }
    await this.proposals.save(proposal);
    return this.views.toView(proposal, input.proposerId);
  }
}
