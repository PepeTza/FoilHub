import type { Page } from '../../../application/ports/page.js';
import type { CardOutput } from '../../../application/use-cases/cards/card.types.js';

export interface CardDto {
  code: string;
  name: string;
  setName: string | null;
  rarity: string | null;
  color: string | null;
  cardType: string | null;
  imageUrl: string | null;
}

export const CardPresenter = {
  toDto(card: CardOutput): CardDto {
    return {
      code: card.code,
      name: card.name,
      setName: card.setName,
      rarity: card.rarity,
      color: card.color,
      cardType: card.cardType,
      imageUrl: card.imageUrl,
    };
  },

  toPageDto(page: Page<CardOutput>): Page<CardDto> {
    return {
      items: page.items.map((item) => CardPresenter.toDto(item)),
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
    };
  },
};
