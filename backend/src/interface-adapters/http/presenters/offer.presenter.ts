import type { Page } from '../../../application/ports/page.js';
import type { OfferView } from '../../../application/use-cases/offers/offer-view.js';
import type { OfferStatus } from '../../../domain/entities/trade-offer.entity.js';
import type { UserSummaryDto } from './auth.presenter.js';
import { type CardDto, CardPresenter } from './card.presenter.js';

/** OfferDto del contrato (docs/ARCHITECTURE.md §6). */
export interface OfferDto {
  id: string;
  owner: UserSummaryDto;
  offered: { card: CardDto; quantity: number };
  wanted: { card: CardDto; quantity: number };
  status: OfferStatus;
  createdAt: string;
  closedAt: string | null;
}

export const OfferPresenter = {
  toDto(view: OfferView): OfferDto {
    return {
      id: view.id,
      owner: { id: view.owner.id, username: view.owner.username },
      offered: {
        card: CardPresenter.toDto(view.offered.card),
        quantity: view.offered.quantity,
      },
      wanted: {
        card: CardPresenter.toDto(view.wanted.card),
        quantity: view.wanted.quantity,
      },
      status: view.status,
      createdAt: view.createdAt.toISOString(),
      closedAt: view.closedAt?.toISOString() ?? null,
    };
  },

  toDtos(views: OfferView[]): OfferDto[] {
    return views.map((view) => OfferPresenter.toDto(view));
  },

  toPageDto(page: Page<OfferView>): Page<OfferDto> {
    return { ...page, items: OfferPresenter.toDtos(page.items) };
  },
};
