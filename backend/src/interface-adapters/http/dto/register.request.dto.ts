import { IsOptional, IsString, MaxLength } from 'class-validator';

// Solo tipos y límites de transporte: las reglas de username y contraseña las valida
// el dominio (INVALID_USERNAME, WEAK_PASSWORD).
export class RegisterRequestDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactInfo?: string;
}
