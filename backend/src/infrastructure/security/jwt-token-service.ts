import type { JwtService } from '@nestjs/jwt';
import type {
  TokenPayload,
  TokenService,
} from '../../application/ports/token-service.port.js';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwt: JwtService,
    readonly expiresInSeconds: number,
  ) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync({ sub: payload.sub, username: payload.username });
  }

  /** Lanza si la firma no es válida o el token venció. */
  async verify(token: string): Promise<TokenPayload> {
    const { sub, username } =
      await this.jwt.verifyAsync<Partial<TokenPayload>>(token);
    if (typeof sub !== 'string' || typeof username !== 'string') {
      throw new Error('Token sin sub/username');
    }
    return { sub, username };
  }
}

/** `JWT_EXPIRES_IN`: segundos (`3600`) o con unidad (`30m`, `1h`, `7d`). Por defecto 1h. */
export function parseExpiresIn(raw: string | undefined): number {
  const match = /^(\d+)\s*([smhd]?)$/.exec((raw ?? '1h').trim());
  if (!match) {
    throw new Error(
      `JWT_EXPIRES_IN inválido: "${raw}" (usa 3600, 30m, 1h o 7d)`,
    );
  }
  const units: Record<string, number> = {
    '': 1,
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return Number(match[1]) * (units[match[2] ?? ''] ?? 1);
}
