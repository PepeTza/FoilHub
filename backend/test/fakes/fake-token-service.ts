import type {
  TokenPayload,
  TokenService,
} from '../../src/application/ports/token-service.port.js';

export class FakeTokenService implements TokenService {
  readonly expiresInSeconds = 3600;

  async sign(payload: TokenPayload): Promise<string> {
    return `token:${payload.sub}:${payload.username}`;
  }

  async verify(token: string): Promise<TokenPayload> {
    const [prefix, sub, username] = token.split(':');
    if (prefix !== 'token' || !sub || !username) {
      throw new Error('Token inválido');
    }
    return { sub, username };
  }
}
