import { apiFetch } from './client';
import type { CardDto, PageDto } from './types';

export interface SearchCardsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function searchCards(
  params: SearchCardsParams = {},
): Promise<PageDto<CardDto>> {
  const query = new URLSearchParams();
  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.pageSize !== undefined) {
    query.set('pageSize', String(params.pageSize));
  }

  const suffix = query.toString();
  return apiFetch<PageDto<CardDto>>(`/api/cards${suffix ? `?${suffix}` : ''}`);
}

export function getCardByCode(code: string): Promise<CardDto> {
  return apiFetch<CardDto>(`/api/cards/${encodeURIComponent(code)}`);
}
