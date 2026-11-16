import { OfferNotFoundError } from '../../../domain/errors/domain-errors.js';
import type { Clock } from '../../ports/clock.port.js';
import type { UnitOfWork } from '../../ports/unit-of-work.port.js';
import type { OfferView, OfferViewAssembler } from './offer-view.js';

export interface CancelTradeOfferInput {
  offerId: string;
  userId: string;
}

export class CancelTradeOfferUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly views: OfferViewAssembler,
  ) {}

  /** Cancela la oferta y rechaza sus propuestas PENDING en la misma transacción. */
  async execute(input: CancelTradeOfferInput): Promise<OfferView> {
    const now = this.clock.now();
    const offer = await this.uow.run(async ({ offers, proposals }) => {
      const found = await offers.findById(input.offerId);
      if (!found) {
        throw new OfferNotFoundError();
      }
      found.cancel(input.userId, now);
      await offers.save(found);

      const pending = await proposals.findPendingByOffer(found.id);
      pending.forEach((p) => p.autoReject(now));
      await proposals.saveMany(pending);
      return found;
    });
    return this.views.toView(offer);
  }
}
