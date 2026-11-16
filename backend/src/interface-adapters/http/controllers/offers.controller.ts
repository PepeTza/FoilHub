import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { Page } from '../../../application/ports/page.js';
import { CancelTradeOfferUseCase } from '../../../application/use-cases/offers/cancel-trade-offer.use-case.js';
import { CreateTradeOfferUseCase } from '../../../application/use-cases/offers/create-trade-offer.use-case.js';
import { FindMatchesForOfferUseCase } from '../../../application/use-cases/offers/find-matches-for-offer.use-case.js';
import { GetOfferUseCase } from '../../../application/use-cases/offers/get-offer.use-case.js';
import { ListMyOffersUseCase } from '../../../application/use-cases/offers/list-my-offers.use-case.js';
import { ListOpenOffersUseCase } from '../../../application/use-cases/offers/list-open-offers.use-case.js';
import type { AuthenticatedUser } from '../authenticated-request.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { CreateOfferRequestDto } from '../dto/create-offer.request.dto.js';
import { ListOffersQueryDto } from '../dto/list-offers.query.dto.js';
import { MyOffersQueryDto } from '../dto/my-offers.query.dto.js';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from '../guards/jwt-auth.guard.js';
import {
  type OfferDto,
  OfferPresenter,
} from '../presenters/offer.presenter.js';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly createOffer: CreateTradeOfferUseCase,
    private readonly listOpenOffers: ListOpenOffersUseCase,
    private readonly listMyOffers: ListMyOffersUseCase,
    private readonly getOffer: GetOfferUseCase,
    private readonly cancelOffer: CancelTradeOfferUseCase,
    private readonly findMatches: FindMatchesForOfferUseCase,
  ) {}

  /** Público. Con sesión, no incluye las ofertas propias. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @Query() query: ListOffersQueryDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ): Promise<Page<OfferDto>> {
    const page = await this.listOpenOffers.execute({
      viewerId: user?.id,
      offeredCardCode: query.offeredCardCode,
      wantedCardCode: query.wantedCardCode,
      page: query.page,
      pageSize: query.pageSize,
    });
    return OfferPresenter.toPageDto(page);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() body: CreateOfferRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferDto> {
    return OfferPresenter.toDto(
      await this.createOffer.execute({
        ownerId: user.id,
        offeredCardCode: body.offeredCardCode,
        offeredQuantity: body.offeredQuantity,
        wantedCardCode: body.wantedCardCode,
        wantedQuantity: body.wantedQuantity,
      }),
    );
  }

  // Antes de ':id' para que "mine" no se tome como un id.
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async mine(
    @Query() query: MyOffersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferDto[]> {
    return OfferPresenter.toDtos(
      await this.listMyOffers.execute({
        ownerId: user.id,
        status: query.status,
      }),
    );
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<OfferDto> {
    return OfferPresenter.toDto(await this.getOffer.execute({ offerId: id }));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferDto> {
    return OfferPresenter.toDto(
      await this.cancelOffer.execute({ offerId: id, userId: user.id }),
    );
  }

  /** Solo el dueño de la oferta. */
  @Get(':id/matches')
  @UseGuards(JwtAuthGuard)
  async matches(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfferDto[]> {
    return OfferPresenter.toDtos(
      await this.findMatches.execute({ offerId: id, userId: user.id }),
    );
  }
}
