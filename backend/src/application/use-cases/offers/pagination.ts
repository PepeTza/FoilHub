import type { PageRequest } from '../../ports/page.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/** page ≥ 1; 1 ≤ pageSize ≤ 50 (mismo criterio que GET /api/cards). */
export function normalizePage(page?: number, pageSize?: number): PageRequest {
  return {
    page: Math.max(1, Math.trunc(page ?? 1)),
    pageSize: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(pageSize ?? DEFAULT_PAGE_SIZE)),
    ),
  };
}
