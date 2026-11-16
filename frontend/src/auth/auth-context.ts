import { createContext } from 'react';
import type { UserSummaryDto } from '../api/types';

export interface AuthContextValue {
  token: string | null;
  user: UserSummaryDto | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserSummaryDto) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
