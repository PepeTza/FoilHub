import type { Request } from 'express';

/** Usuario autenticado que dejan los guards en `request.user`. */
export interface AuthenticatedUser {
  id: string;
  username: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
