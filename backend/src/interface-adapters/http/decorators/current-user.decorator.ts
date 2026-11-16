import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../authenticated-request.js';

/**
 * Usuario del token. Con JwtAuthGuard siempre existe; con OptionalJwtAuthGuard puede ser
 * `undefined` (petición anónima).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
