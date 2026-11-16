import type { ApiErrorBody, UserSummaryDto } from './types';

export const TOKEN_STORAGE_KEY = 'foilhub_token';
export const USER_STORAGE_KEY = 'foilhub_user';

/** Error tipado correspondiente al formato de respuesta de error del contrato (§6). */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly messages: string[];

  constructor(body: ApiErrorBody) {
    const messages = Array.isArray(body.message) ? body.message : [body.message];
    super(messages.join('; '));
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.error = body.error;
    this.messages = messages;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): UserSummaryDto | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'username' in parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.username === 'string'
    ) {
      return { id: parsed.id, username: parsed.username };
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserSummaryDto): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function clearStoredAuth(): void {
  clearStoredToken();
  clearStoredUser();
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const hasValidMessage =
    typeof record.message === 'string' ||
    (Array.isArray(record.message) && record.message.every((item) => typeof item === 'string'));
  return (
    typeof record.statusCode === 'number' && typeof record.error === 'string' && hasValidMessage
  );
}

/**
 * Wrapper de fetch para la API REST (/api).
 * Agrega Authorization Bearer si hay sesión en localStorage y lanza ApiError en respuestas 4xx/5xx.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    let errorBody: ApiErrorBody = {
      statusCode: response.status,
      error: 'HTTP_ERROR',
      message: response.statusText || 'Error inesperado al consultar la API',
    };

    try {
      const parsed: unknown = await response.json();
      if (isApiErrorBody(parsed)) {
        errorBody = parsed;
      }
    } catch {
      // Respuesta sin cuerpo JSON: se conserva el fallback construido arriba.
    }

    throw new ApiError(errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();
  return data as T;
}
