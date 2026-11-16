import { TradeOffer } from '../../../domain/entities/trade-offer.entity.js';
import { CardNotFoundError } from '../../../domain/errors/domain-errors.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import { Quantity } from '../../../domain/value-objects/quantity.vo.js';
import type { CardRepository } from '../../ports/card-repository.port.js';
import type { Clock } from '../../ports/clock.port.js';
import type { IdGenerator } from '../../ports/id-generator.port.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { OfferView, OfferViewAssembler } from './offer-view.js';

export interface CreateTradeOfferInput {
  ownerId: string;
  offeredCardCode: string;
  offeredQuantity: number;
  wantedCardCode: string;
  wantedQuantity: number;
}

export class CreateTradeOfferUseCase {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly cards: CardRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly views: OfferViewAssembler,
  ) {}

  async execute(input: CreateTradeOfferInput): Promise<OfferView> {
    const offeredQuantity = Quantity.create(input.offeredQuantity);
    const wantedQuantity = Quantity.create(input.wantedQuantity);
    const [offeredCard, wantedCard] = await Promise.all([
      this.findCard(input.offeredCardCode),
      this.findCard(input.wantedCardCode),
    ]);

    const offer = TradeOffer.create({
      id: this.ids.next(),
      ownerId: input.ownerId,
      offeredCardId: offeredCard.id,
      offeredQuantity,
      wantedCardId: wantedCard.id,
      wantedQuantity,
      createdAt: this.clock.now(),
    });
    await this.offers.save(offer);
    return this.views.toView(offer);
  }

  private async findCard(rawCode: string) {
    const code = CardCode.create(rawCode);
    const card = await this.cards.findByCode(code);
    if (!card) {
      throw new CardNotFoundError(code.value);
    }
    return card;
  }
}
