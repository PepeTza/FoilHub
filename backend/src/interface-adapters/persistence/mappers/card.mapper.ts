import { Card } from '../../../domain/entities/card.entity.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import type { Card as CardRow } from '../../../generated/prisma/client.js';

export const CardMapper = {
  toDomain(row: CardRow): Card {
    return Card.restore({
      id: row.id,
      code: CardCode.restore(row.code),
      name: row.name,
      setName: row.setName,
      rarity: row.rarity,
      color: row.color,
      cardType: row.cardType,
      imageUrl: row.imageUrl,
    });
  },

  toPersistence(card: Card): CardRow {
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
  },
};
