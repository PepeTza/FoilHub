import { Module } from '@nestjs/common';
import type { CardRepository } from '../../application/ports/card-repository.port.js';
import type { Clock } from '../../application/ports/clock.port.js';
import type { IdGenerator } from '../../application/ports/id-generator.port.js';
import type { TradeOfferRepository } from '../../application/ports/trade-offer-repository.port.js';
import type { UnitOfWork } from '../../application/ports/unit-of-work.port.js';
import type { UserRepository } from '../../application/ports/user-repository.port.js';
import { CancelTradeOfferUseCase } from '../../application/use-cases/offers/cancel-trade-offer.use-case.js';
import { CreateTradeOfferUseCase } from '../../application/use-cases/offers/create-trade-offer.use-case.js';
import { FindMatchesForOfferUseCase } from '../../application/use-cases/offers/find-matches-for-offer.use-case.js';
import { GetOfferUseCase } from '../../application/use-cases/offers/get-offer.use-case.js';
import { ListMyOffersUseCase } from '../../application/use-cases/offers/list-my-offers.use-case.js';
import { ListOpenOffersUseCase } from '../../application/use-cases/offers/list-open-offers.use-case.js';
import { OfferViewAssembler } from '../../application/use-cases/offers/offer-view.js';
import {
  CARD_REPOSITORY,
  CLOCK,
  ID_GENERATOR,
  TRADE_OFFER_REPOSITORY,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../../interface-adapters/di-tokens.js';
import { OffersController } from '../../interface-adapters/http/controllers/offers.controller.js';
import { AuthModule } from './auth.module.js';
import { CardsModule } from './cards.module.js';

/**
 * Ofertas. CARD_REPOSITORY viene de CardsModule (B4) y los guards de AuthModule;
 * el resto (repos, UNIT_OF_WORK, ID_GENERATOR, CLOCK) del CoreModule global.
 * Exporta OfferViewAssembler para que ProposalsModule (A7) arme las ofertas de cada propuesta.
 */
@Module({
  imports: [CardsModule, AuthModule],
  controllers: [OffersController],
  providers: [
    {
      provide: OfferViewAssembler,
      useFactory: (cards: CardRepository, users: UserRepository) =>
        new OfferViewAssembler(cards, users),
      inject: [CARD_REPOSITORY, USER_REPOSITORY],
    },
    {
      provide: CreateTradeOfferUseCase,
      useFactory: (
        offers: TradeOfferRepository,
        cards: CardRepository,
        ids: IdGenerator,
        clock: Clock,
        views: OfferViewAssembler,
      ) => new CreateTradeOfferUseCase(offers, cards, ids, clock, views),
      inject: [
        TRADE_OFFER_REPOSITORY,
        CARD_REPOSITORY,
        ID_GENERATOR,
        CLOCK,
        OfferViewAssembler,
      ],
    },
    {
      provide: ListOpenOffersUseCase,
      useFactory: (
        offers: TradeOfferRepository,
        cards: CardRepository,
        views: OfferViewAssembler,
      ) => new ListOpenOffersUseCase(offers, cards, views),
      inject: [TRADE_OFFER_REPOSITORY, CARD_REPOSITORY, OfferViewAssembler],
    },
    {
      provide: ListMyOffersUseCase,
      useFactory: (offers: TradeOfferRepository, views: OfferViewAssembler) =>
        new ListMyOffersUseCase(offers, views),
      inject: [TRADE_OFFER_REPOSITORY, OfferViewAssembler],
    },
    {
      provide: GetOfferUseCase,
      useFactory: (offers: TradeOfferRepository, views: OfferViewAssembler) =>
        new GetOfferUseCase(offers, views),
      inject: [TRADE_OFFER_REPOSITORY, OfferViewAssembler],
    },
    {
      provide: CancelTradeOfferUseCase,
      useFactory: (uow: UnitOfWork, clock: Clock, views: OfferViewAssembler) =>
        new CancelTradeOfferUseCase(uow, clock, views),
      inject: [UNIT_OF_WORK, CLOCK, OfferViewAssembler],
    },
    {
      provide: FindMatchesForOfferUseCase,
      useFactory: (offers: TradeOfferRepository, views: OfferViewAssembler) =>
        new FindMatchesForOfferUseCase(offers, views),
      inject: [TRADE_OFFER_REPOSITORY, OfferViewAssembler],
    },
  ],
  exports: [OfferViewAssembler],
})
export class OffersModule {}
