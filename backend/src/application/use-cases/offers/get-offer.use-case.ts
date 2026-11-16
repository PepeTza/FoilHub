import { OfferNotFoundError } from '../../../domain/errors/domain-errors.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { OfferView, OfferViewAssembler } from './offer-view.js';

export interface GetOfferInput {
  offerId: string;
}

export class GetOfferUseCase {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly views: OfferViewAssembler,
  ) {}

  async execute(input: GetOfferInput): Promise<OfferView> {
    const offer = await this.offers.findById(input.offerId);
    if (!offer) {
      throw new OfferNotFoundError();
    }
    return this.views.toView(offer);
  }
}
