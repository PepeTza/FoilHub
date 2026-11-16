export interface TokenPayload {
  /** Id del usuario. */
  sub: string;
  username: string;
}

export interface TokenService {
  sign(payload: TokenPayload): Promise<string>;
  /** Lanza un error si el token es inválido o venció. */
  verify(token: string): Promise<TokenPayload>;
}
