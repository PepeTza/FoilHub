import type { TradeProposal } from '../../../domain/entities/trade-proposal.entity.js';
import { ProposalNotFoundError } from '../../../domain/errors/domain-errors.js';
import type { Clock } from '../../ports/clock.port.js';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../ports/unit-of-work.port.js';
import { loadOffer } from './load-offer.js';
import type { ProposalView, ProposalViewAssembler } from './proposal-view.js';

export interface AcceptProposalInput {
  proposalId: string;
  /** Debe ser el dueño de la oferta. */
  userId: string;
}

export class AcceptProposalUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly views: ProposalViewAssembler,
  ) {}

  /**
   * En UNA transacción: propuesta → ACCEPTED, oferta → COMPLETED, contraoferta (si hay) → COMPLETED
   * y las demás PENDING de esas ofertas → REJECTED. Si otro aceptó la oferta a la vez, el cierre
   * condicional de la oferta lanza ConcurrencyConflictError y se hace rollback de todo.
   */
  async execute(input: AcceptProposalInput): Promise<ProposalView> {
    const now = this.clock.now();
    const accepted = await this.uow.run(async (repos) => {
      const proposal = await repos.proposals.findById(input.proposalId);
      if (!proposal) {
        throw new ProposalNotFoundError();
      }
      const offer = await loadOffer(repos.offers, proposal.offerId);
      proposal.accept(input.userId, offer, now);

      // La oferta se escribe primero: es la fila que bloquea a un accept simultáneo.
      offer.complete(now);
      await repos.offers.save(offer);
      if (proposal.counterOfferId) {
        const counterOffer = await loadOffer(
          repos.offers,
          proposal.counterOfferId,
        );
        counterOffer.complete(now);
        await repos.offers.save(counterOffer);
        await rejectOtherPending(repos, counterOffer.id, proposal, now);
      }
      await rejectOtherPending(repos, offer.id, proposal, now);
      await repos.proposals.save(proposal);
      return proposal;
    });
    return this.views.toView(accepted, input.userId);
  }
}

async function rejectOtherPending(
  repos: TransactionalRepositories,
  offerId: string,
  accepted: TradeProposal,
  at: Date,
): Promise<void> {
  const others = (await repos.proposals.findPendingByOffer(offerId)).filter(
    (p) => p.id !== accepted.id,
  );
  others.forEach((p) => p.autoReject(at));
  await repos.proposals.saveMany(others);
}
