import type { OfferStatus } from '../../../domain/entities/trade-offer.entity.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { OfferView, OfferViewAssembler } from './offer-view.js';

export interface ListMyOffersInput {
  ownerId: string;
  status?: OfferStatus;
}

export class ListMyOffersUseCase {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly views: OfferViewAssembler,
  ) {}

  async execute(input: ListMyOffersInput): Promise<OfferView[]> {
    return this.views.toViews(
      await this.offers.listByOwner(input.ownerId, input.status),
    );
  }
}
