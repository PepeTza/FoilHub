import { apiFetch } from './client';
import type { CurrentUserDto, LoginResponseDto, UserSummaryDto } from './types';

export interface RegisterUserInput {
  username: string;
  password: string;
  contactInfo?: string;
}

export interface LoginUserInput {
  username: string;
  password: string;
}

export function registerUser(input: RegisterUserInput): Promise<UserSummaryDto> {
  const contactInfo = input.contactInfo?.trim();
  return apiFetch<UserSummaryDto>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username.trim(),
      password: input.password,
      ...(contactInfo ? { contactInfo } : {}),
    }),
  });
}

export function loginUser(input: LoginUserInput): Promise<LoginResponseDto> {
  return apiFetch<LoginResponseDto>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username.trim(),
      password: input.password,
    }),
  });
}

export function getCurrentUser(): Promise<CurrentUserDto> {
  return apiFetch<CurrentUserDto>('/api/auth/me');
}
