import type { ProposalView } from '../../../application/use-cases/proposals/proposal-view.js';
import type { ProposalStatus } from '../../../domain/entities/trade-proposal.entity.js';
import type { UserSummaryDto } from './auth.presenter.js';
import { type OfferDto, OfferPresenter } from './offer.presenter.js';

/** ProposalDto del contrato (docs/ARCHITECTURE.md §6). */
export interface ProposalDto {
  id: string;
  offer: OfferDto;
  proposer: UserSummaryDto;
  counterOffer: OfferDto | null;
  message: string | null;
  status: ProposalStatus;
  createdAt: string;
  respondedAt: string | null;
  contacts: { offerOwner: string | null; proposer: string | null } | null;
}

export const ProposalPresenter = {
  toDto(view: ProposalView): ProposalDto {
    return {
      id: view.id,
      offer: OfferPresenter.toDto(view.offer),
      proposer: { id: view.proposer.id, username: view.proposer.username },
      counterOffer: view.counterOffer
        ? OfferPresenter.toDto(view.counterOffer)
        : null,
      message: view.message,
      status: view.status,
      createdAt: view.createdAt.toISOString(),
      respondedAt: view.respondedAt?.toISOString() ?? null,
      contacts: view.contacts
        ? {
            offerOwner: view.contacts.offerOwner,
            proposer: view.contacts.proposer,
          }
        : null,
    };
  },

  toDtos(views: ProposalView[]): ProposalDto[] {
    return views.map((view) => ProposalPresenter.toDto(view));
  },
};
