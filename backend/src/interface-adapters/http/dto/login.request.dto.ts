import { IsString, MaxLength } from 'class-validator';

// Sin límites de username: uno mal formado debe dar el mismo INVALID_CREDENTIALS.
export class LoginRequestDto {
  @IsString()
  username!: string;

  /** Tope de transporte para no hashear cuerpos enormes. */
  @IsString()
  @MaxLength(200)
  password!: string;
}
