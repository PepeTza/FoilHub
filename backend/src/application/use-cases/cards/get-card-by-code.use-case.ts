import {
  CardNotFoundError,
  InvalidCardCodeError,
} from '../../../domain/errors/domain-errors.js';
import { CardCode } from '../../../domain/value-objects/card-code.vo.js';
import type { CardRepository } from '../../ports/card-repository.port.js';
import { type CardOutput, toCardOutput } from './card.types.js';

export interface GetCardByCodeInput {
  code: string;
}

export class GetCardByCodeUseCase {
  constructor(private readonly cards: CardRepository) {}

  async execute(input: GetCardByCodeInput): Promise<CardOutput> {
    let code: CardCode;
    try {
      code = CardCode.create(input.code);
    } catch (error) {
      if (error instanceof InvalidCardCodeError) {
        throw new CardNotFoundError(input.code);
      }
      throw error;
    }

    const card = await this.cards.findByCode(code);
    if (!card) {
      throw new CardNotFoundError(code.value);
    }

    return toCardOutput(card);
  }
}
