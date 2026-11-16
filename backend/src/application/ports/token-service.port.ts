export interface TokenPayload {
  /** Id del usuario. */
  sub: string;
  username: string;
}

export interface TokenService {
  /** Vigencia de los tokens que firma, en segundos (`expiresIn` de la respuesta de login). */
  readonly expiresInSeconds: number;
  sign(payload: TokenPayload): Promise<string>;
  /** Lanza un error si el token es inválido o venció. */
  verify(token: string): Promise<TokenPayload>;
}
