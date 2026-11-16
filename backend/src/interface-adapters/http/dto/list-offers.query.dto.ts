import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListOffersQueryDto {
  @IsOptional()
  @IsString()
  offeredCardCode?: string;

  @IsOptional()
  @IsString()
  wantedCardCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Más de 50 se limita a 50 en el caso de uso. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
