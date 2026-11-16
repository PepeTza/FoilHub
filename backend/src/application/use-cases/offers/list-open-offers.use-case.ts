import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import type { CardRepository } from '../../ports/card-repository.port.js';
import type { Page } from '../../ports/page.js';
import type { TradeOfferRepository } from '../../ports/trade-offer-repository.port.js';
import type { OfferView, OfferViewAssembler } from './offer-view.js';
import { normalizePage } from './pagination.js';

export interface ListOpenOffersInput {
  /** Usuario autenticado, si lo hay: sus propias ofertas no se listan. */
  viewerId?: string;
  offeredCardCode?: string;
  wantedCardCode?: string;
  page?: number;
  pageSize?: number;
}

export class ListOpenOffersUseCase {
  constructor(
    private readonly offers: TradeOfferRepository,
    private readonly cards: CardRepository,
    private readonly views: OfferViewAssembler,
  ) {}

  async execute(input: ListOpenOffersInput): Promise<Page<OfferView>> {
    const { page, pageSize } = normalizePage(input.page, input.pageSize);
    const [offeredCardId, wantedCardId] = await Promise.all([
      this.cardIdFilter(input.offeredCardCode),
      this.cardIdFilter(input.wantedCardCode),
    ]);
    // Filtrar por una carta que no existe no es un error: simplemente no hay ofertas.
    if (offeredCardId === null || wantedCardId === null) {
      return { items: [], page, pageSize, total: 0 };
    }

    const result = await this.offers.listOpen({
      offeredCardId,
      wantedCardId,
      excludeOwnerId: input.viewerId,
      page,
      pageSize,
    });
    return { ...result, items: await this.views.toViews(result.items) };
  }

  /** undefined = sin filtro; null = carta inexistente o código inválido. */
  private async cardIdFilter(
    rawCode?: string,
  ): Promise<string | undefined | null> {
    if (!rawCode?.trim()) {
      return undefined;
    }
    let code: CardCode;
    try {
      code = CardCode.create(rawCode);
    } catch {
      return null;
    }
    return (await this.cards.findByCode(code))?.id ?? null;
  }
}
