import { apiFetch } from './client';
import type { ProposalDto, ProposalStatus } from './types';

export type ProposalBox = 'received' | 'sent';

export interface ProposeTradeInput {
  counterOfferId?: string;
  message?: string;
}

export interface ListProposalsParams {
  box?: ProposalBox;
  status?: ProposalStatus;
}

export function proposeTrade(
  offerId: string,
  input: ProposeTradeInput = {},
): Promise<ProposalDto> {
  const message = input.message?.trim();
  const counterOfferId = input.counterOfferId?.trim();
  return apiFetch<ProposalDto>(
    `/api/offers/${encodeURIComponent(offerId)}/proposals`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...(counterOfferId ? { counterOfferId } : {}),
        ...(message ? { message } : {}),
      }),
    },
  );
}

export function listMyProposals(
  params: ListProposalsParams = {},
): Promise<ProposalDto[]> {
  const query = new URLSearchParams();
  if (params.box) {
    query.set('box', params.box);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  const suffix = query.toString();
  return apiFetch<ProposalDto[]>(`/api/proposals${suffix ? `?${suffix}` : ''}`);
}

export function acceptProposal(id: string): Promise<ProposalDto> {
  return apiFetch<ProposalDto>(
    `/api/proposals/${encodeURIComponent(id)}/accept`,
    { method: 'POST' },
  );
}

export function rejectProposal(id: string): Promise<ProposalDto> {
  return apiFetch<ProposalDto>(
    `/api/proposals/${encodeURIComponent(id)}/reject`,
    { method: 'POST' },
  );
}

export function cancelProposal(id: string): Promise<ProposalDto> {
  return apiFetch<ProposalDto>(
    `/api/proposals/${encodeURIComponent(id)}/cancel`,
    { method: 'POST' },
  );
}
