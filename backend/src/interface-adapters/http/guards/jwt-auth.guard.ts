import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { TokenService } from '../../../application/ports/token-service.port.js';
import { TOKEN_SERVICE } from '../../di-tokens.js';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../authenticated-request.js';

/** Exige `Authorization: Bearer <token>` válido. Sin token o con token inválido/vencido → 401. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    const user = await authenticate(this.tokens, token);
    if (!user) {
      throw new UnauthorizedException();
    }
    request.user = user;
    return true;
  }
}

/** Como JwtAuthGuard pero nunca falla: sin token (o con uno inválido) la petición sigue como anónima. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request);
    const user = token ? await authenticate(this.tokens, token) : null;
    if (user) {
      request.user = user;
    }
    return true;
  }
}

function bearerToken(request: AuthenticatedRequest): string | null {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

async function authenticate(
  tokens: TokenService,
  token: string,
): Promise<AuthenticatedUser | null> {
  try {
    const { sub, username } = await tokens.verify(token);
    return { id: sub, username };
  } catch {
    return null;
  }
}
