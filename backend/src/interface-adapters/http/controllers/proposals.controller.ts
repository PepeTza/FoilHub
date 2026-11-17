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
import { AcceptProposalUseCase } from '../../../application/use-cases/proposals/accept-proposal.use-case.js';
import { CancelProposalUseCase } from '../../../application/use-cases/proposals/cancel-proposal.use-case.js';
import { ListMyProposalsUseCase } from '../../../application/use-cases/proposals/list-my-proposals.use-case.js';
import { ProposeTradeUseCase } from '../../../application/use-cases/proposals/propose-trade.use-case.js';
import { RejectProposalUseCase } from '../../../application/use-cases/proposals/reject-proposal.use-case.js';
import type { AuthenticatedUser } from '../authenticated-request.js';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { CreateProposalRequestDto } from '../dto/create-proposal.request.dto.js';
import { ListProposalsQueryDto } from '../dto/list-proposals.query.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import {
  type ProposalDto,
  ProposalPresenter,
} from '../presenters/proposal.presenter.js';

/**
 * Todas las rutas requieren sesión. `POST /api/offers/:id/proposals` vive aquí (y no en
 * OffersController) para que OffersModule no dependa de ProposalsModule.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(
    private readonly proposeTrade: ProposeTradeUseCase,
    private readonly listMyProposals: ListMyProposalsUseCase,
    private readonly acceptProposal: AcceptProposalUseCase,
    private readonly rejectProposal: RejectProposalUseCase,
    private readonly cancelProposal: CancelProposalUseCase,
  ) {}

  @Post('offers/:id/proposals')
  async propose(
    @Param('id') offerId: string,
    @Body() body: CreateProposalRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalDto> {
    const view = await this.proposeTrade.execute({
      offerId,
      proposerId: user.id,
      counterOfferId: body.counterOfferId,
      message: body.message,
    });
    return ProposalPresenter.toDto(view);
  }

  @Get('proposals')
  async list(
    @Query() query: ListProposalsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalDto[]> {
    const views = await this.listMyProposals.execute({
      userId: user.id,
      box: query.box ?? 'received',
      status: query.status,
    });
    return ProposalPresenter.toDtos(views);
  }

  @Post('proposals/:id/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalDto> {
    return ProposalPresenter.toDto(
      await this.acceptProposal.execute({ proposalId: id, userId: user.id }),
    );
  }

  @Post('proposals/:id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalDto> {
    return ProposalPresenter.toDto(
      await this.rejectProposal.execute({ proposalId: id, userId: user.id }),
    );
  }

  @Post('proposals/:id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProposalDto> {
    return ProposalPresenter.toDto(
      await this.cancelProposal.execute({ proposalId: id, userId: user.id }),
    );
  }
}
