import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProposalRequestDto {
  /** Oferta propia que es la inversa exacta (si no hace match → COUNTER_OFFER_NOT_MATCHING). */
  @IsOptional()
  @IsString()
  counterOfferId?: string;

  /** Límite de §5 (VARCHAR(280)); el contrato no tiene code de dominio para esto. */
  @IsOptional()
  @IsString()
  @MaxLength(280)
  message?: string;
}
