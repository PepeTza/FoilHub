import { apiFetch } from './client';
import type { OfferDto, OfferStatus, PageDto } from './types';

export interface ListOpenOffersParams {
  offeredCardCode?: string;
  wantedCardCode?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateOfferInput {
  offeredCardCode: string;
  offeredQuantity: number;
  wantedCardCode: string;
  wantedQuantity: number;
}

export function listOpenOffers(
  params: ListOpenOffersParams = {},
): Promise<PageDto<OfferDto>> {
  const query = new URLSearchParams();
  if (params.offeredCardCode?.trim()) {
    query.set('offeredCardCode', params.offeredCardCode.trim());
  }
  if (params.wantedCardCode?.trim()) {
    query.set('wantedCardCode', params.wantedCardCode.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.pageSize !== undefined) {
    query.set('pageSize', String(params.pageSize));
  }

  const suffix = query.toString();
  return apiFetch<PageDto<OfferDto>>(`/api/offers${suffix ? `?${suffix}` : ''}`);
}

export function createOffer(input: CreateOfferInput): Promise<OfferDto> {
  return apiFetch<OfferDto>('/api/offers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listMyOffers(status?: OfferStatus): Promise<OfferDto[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<OfferDto[]>(`/api/offers/mine${query}`);
}

export function getOffer(id: string): Promise<OfferDto> {
  return apiFetch<OfferDto>(`/api/offers/${encodeURIComponent(id)}`);
}

export function cancelOffer(id: string): Promise<OfferDto> {
  return apiFetch<OfferDto>(`/api/offers/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  });
}

export function getOfferMatches(id: string): Promise<OfferDto[]> {
  return apiFetch<OfferDto[]>(`/api/offers/${encodeURIComponent(id)}/matches`);
}
