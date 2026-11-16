import type { CardRepository } from '../../ports/card-repository.port.js';
import type { Page } from '../../ports/page.js';
import { type CardOutput, toCardOutput } from './card.types.js';

export interface SearchCardsInput {
  search?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export class SearchCardsUseCase {
  constructor(private readonly cards: CardRepository) {}

  async execute(input: SearchCardsInput = {}): Promise<Page<CardOutput>> {
    const page = Math.max(1, Math.trunc(input.page ?? DEFAULT_PAGE));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(input.pageSize ?? DEFAULT_PAGE_SIZE)),
    );
    const text = input.search?.trim() || undefined;

    const result = await this.cards.search({ text, page, pageSize });
    return {
      items: result.items.map((card) => toCardOutput(card)),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }
}
