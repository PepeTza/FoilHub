import type { Card } from '../../../domain/entities/card.entity.js';

export interface CardOutput {
  id: string;
  code: string;
  name: string;
  setName: string | null;
  rarity: string | null;
  color: string | null;
  cardType: string | null;
  imageUrl: string | null;
}

export function toCardOutput(card: Card): CardOutput {
  return {
    id: card.id,
    code: card.code.value,
    name: card.name,
    setName: card.setName,
    rarity: card.rarity,
    color: card.color,
    cardType: card.cardType,
    imageUrl: card.imageUrl,
  };
}
