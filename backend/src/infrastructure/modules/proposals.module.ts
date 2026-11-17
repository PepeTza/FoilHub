import { Module } from '@nestjs/common';
import type { Clock } from '../../application/ports/clock.port.js';
import type { IdGenerator } from '../../application/ports/id-generator.port.js';
import type { TradeOfferRepository } from '../../application/ports/trade-offer-repository.port.js';
import type { TradeProposalRepository } from '../../application/ports/trade-proposal-repository.port.js';
import type { UnitOfWork } from '../../application/ports/unit-of-work.port.js';
import type { UserRepository } from '../../application/ports/user-repository.port.js';
import { OfferViewAssembler } from '../../application/use-cases/offers/offer-view.js';
import { AcceptProposalUseCase } from '../../application/use-cases/proposals/accept-proposal.use-case.js';
import { CancelProposalUseCase } from '../../application/use-cases/proposals/cancel-proposal.use-case.js';
import { ListMyProposalsUseCase } from '../../application/use-cases/proposals/list-my-proposals.use-case.js';
import { ProposalViewAssembler } from '../../application/use-cases/proposals/proposal-view.js';
import { ProposeTradeUseCase } from '../../application/use-cases/proposals/propose-trade.use-case.js';
import { RejectProposalUseCase } from '../../application/use-cases/proposals/reject-proposal.use-case.js';
import {
  CLOCK,
  ID_GENERATOR,
  TRADE_OFFER_REPOSITORY,
  TRADE_PROPOSAL_REPOSITORY,
  UNIT_OF_WORK,
  USER_REPOSITORY,
} from '../../interface-adapters/di-tokens.js';
import { ProposalsController } from '../../interface-adapters/http/controllers/proposals.controller.js';
import { AuthModule } from './auth.module.js';
import { OffersModule } from './offers.module.js';

/** Propuestas. OfferViewAssembler viene de OffersModule; guards de AuthModule; el resto del CoreModule. */
@Module({
  imports: [OffersModule, AuthModule],
  controllers: [ProposalsController],
  providers: [
    {
      provide: ProposalViewAssembler,
      useFactory: (
        offers: TradeOfferRepository,
        users: UserRepository,
        offerViews: OfferViewAssembler,
      ) => new ProposalViewAssembler(offers, users, offerViews),
      inject: [TRADE_OFFER_REPOSITORY, USER_REPOSITORY, OfferViewAssembler],
    },
    {
      provide: ProposeTradeUseCase,
      useFactory: (
        offers: TradeOfferRepository,
        proposals: TradeProposalRepository,
        ids: IdGenerator,
        clock: Clock,
        views: ProposalViewAssembler,
      ) => new ProposeTradeUseCase(offers, proposals, ids, clock, views),
      inject: [
        TRADE_OFFER_REPOSITORY,
        TRADE_PROPOSAL_REPOSITORY,
        ID_GENERATOR,
        CLOCK,
        ProposalViewAssembler,
      ],
    },
    {
      provide: ListMyProposalsUseCase,
      useFactory: (
        proposals: TradeProposalRepository,
        views: ProposalViewAssembler,
      ) => new ListMyProposalsUseCase(proposals, views),
      inject: [TRADE_PROPOSAL_REPOSITORY, ProposalViewAssembler],
    },
    {
      provide: AcceptProposalUseCase,
      useFactory: (
        uow: UnitOfWork,
        clock: Clock,
        views: ProposalViewAssembler,
      ) => new AcceptProposalUseCase(uow, clock, views),
      inject: [UNIT_OF_WORK, CLOCK, ProposalViewAssembler],
    },
    {
      provide: RejectProposalUseCase,
      useFactory: (
        proposals: TradeProposalRepository,
        offers: TradeOfferRepository,
        clock: Clock,
        views: ProposalViewAssembler,
      ) => new RejectProposalUseCase(proposals, offers, clock, views),
      inject: [
        TRADE_PROPOSAL_REPOSITORY,
        TRADE_OFFER_REPOSITORY,
        CLOCK,
        ProposalViewAssembler,
      ],
    },
    {
      provide: CancelProposalUseCase,
      useFactory: (
        proposals: TradeProposalRepository,
        clock: Clock,
        views: ProposalViewAssembler,
      ) => new CancelProposalUseCase(proposals, clock, views),
      inject: [TRADE_PROPOSAL_REPOSITORY, CLOCK, ProposalViewAssembler],
    },
  ],
})
export class ProposalsModule {}
