import { IsIn, IsOptional } from 'class-validator';
import type { ProposalBox } from '../../../application/ports/trade-proposal-repository.port.js';
import {
  PROPOSAL_STATUSES,
  type ProposalStatus,
} from '../../../domain/entities/trade-proposal.entity.js';

const BOXES: readonly ProposalBox[] = ['received', 'sent'];

export class ListProposalsQueryDto {
  /** Por defecto `received`. */
  @IsOptional()
  @IsIn(BOXES)
  box?: ProposalBox;

  @IsOptional()
  @IsIn(PROPOSAL_STATUSES)
  status?: ProposalStatus;
}
