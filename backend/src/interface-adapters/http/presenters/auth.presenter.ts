import type {
  CurrentUser,
  UserSummary,
} from '../../../application/use-cases/auth/auth.types.js';
import type { LoginUserOutput } from '../../../application/use-cases/auth/login-user.use-case.js';

// Tipos de respuesta del contrato (docs/ARCHITECTURE.md §6).
export interface UserSummaryDto {
  id: string;
  username: string;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserSummaryDto;
}

export interface MeResponseDto {
  id: string;
  username: string;
  contactInfo: string | null;
}

export const AuthPresenter = {
  userSummary(user: UserSummary): UserSummaryDto {
    return { id: user.id, username: user.username };
  },

  login(output: LoginUserOutput): LoginResponseDto {
    return {
      accessToken: output.accessToken,
      tokenType: 'Bearer',
      expiresIn: output.expiresIn,
      user: AuthPresenter.userSummary(output.user),
    };
  },

  me(user: CurrentUser): MeResponseDto {
    return {
      id: user.id,
      username: user.username,
      contactInfo: user.contactInfo,
    };
  },
};
