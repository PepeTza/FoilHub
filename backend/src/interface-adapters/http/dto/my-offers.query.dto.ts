import { IsIn, IsOptional } from 'class-validator';
import {
  OFFER_STATUSES,
  type OfferStatus,
} from '../../../domain/entities/trade-offer.entity.js';

export class MyOffersQueryDto {
  @IsOptional()
  @IsIn(OFFER_STATUSES)
  status?: OfferStatus;
}
