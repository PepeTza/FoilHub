import {
  NotOfferOwnerError,
  OfferNotFoundError,
} from '../../../domain/errors/domain-errors.js';
import { TradeMatcher } from '../../../domain/services/trade-matcher.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { OfferView, OfferViewAssembler } from './offer-view.js';

export interface FindMatchesForOfferInput {
  offerId: string;
  userId: string;
}

export class FindMatchesForOfferUseCase {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly views: OfferViewAssembler,
  ) {}

  /** Solo el dueño. El repo acota candidatos; la decisión final es de TradeMatcher. */
  async execute(input: FindMatchesForOfferInput): Promise<OfferView[]> {
    const offer = await this.offers.findById(input.offerId);
    if (!offer) {
      throw new OfferNotFoundError();
    }
    if (!offer.isOwnedBy(input.userId)) {
      throw new NotOfferOwnerError();
    }
    const candidates = await this.offers.findMatchCandidates(offer);
    return this.views.toViews(
      candidates.filter((c) => TradeMatcher.isMatch(offer, c)),
    );
  }
}
