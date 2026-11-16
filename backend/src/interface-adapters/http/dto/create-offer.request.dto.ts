import { IsNumber, IsString } from 'class-validator';

// Solo tipos: el formato del código (INVALID_CARD_CODE) y el rango 1–99 de las cantidades
// (INVALID_QUANTITY) los valida el dominio, para que el contrato devuelva esos códigos.
export class CreateOfferRequestDto {
  @IsString()
  offeredCardCode!: string;

  @IsNumber()
  offeredQuantity!: number;

  @IsString()
  wantedCardCode!: string;

  @IsNumber()
  wantedQuantity!: number;
}
