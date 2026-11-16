import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Page } from '../../../application/ports/page.js';
import { GetCardByCodeUseCase } from '../../../application/use-cases/cards/get-card-by-code.use-case.js';
import { SearchCardsUseCase } from '../../../application/use-cases/cards/search-cards.use-case.js';
import { SearchCardsQueryDto } from '../dto/search-cards.query.dto.js';
import { CardPresenter, type CardDto } from '../presenters/card.presenter.js';

@Controller('cards')
export class CardsController {
  constructor(
    private readonly searchCards: SearchCardsUseCase,
    private readonly getCardByCode: GetCardByCodeUseCase,
  ) {}

  @Get()
  async search(@Query() query: SearchCardsQueryDto): Promise<Page<CardDto>> {
    const result = await this.searchCards.execute(query);
    return CardPresenter.toPageDto(result);
  }

  @Get(':code')
  async getByCode(@Param('code') code: string): Promise<CardDto> {
    const card = await this.getCardByCode.execute({ code });
    return CardPresenter.toDto(card);
  }
}
