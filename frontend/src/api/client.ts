import type { ApiErrorBody, UserSummaryDto } from './types';

export const TOKEN_STORAGE_KEY = 'foilhub_token';
export const USER_STORAGE_KEY = 'foilhub_user';
export const UNAUTHORIZED_EVENT = 'foilhub:unauthorized';

const FALLBACK_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
  INVALID_USERNAME:
    'El usuario debe tener entre 3 y 20 caracteres: letras, números o _.',
  WEAK_PASSWORD: 'La contraseña debe tener entre 8 y 72 caracteres.',
  USERNAME_TAKEN: 'Ese nombre de usuario ya está en uso.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  CARD_NOT_FOUND: 'No existe esa carta en el catálogo.',
  INVALID_CARD_CODE: 'El código de carta no es válido (ej. BT1-084).',
  INVALID_QUANTITY: 'La cantidad debe ser un entero entre 1 y 99.',
  SAME_CARD_TRADE: 'No puedes ofrecer y pedir la misma carta.',
  OFFER_NOT_FOUND: 'Oferta no encontrada.',
  OFFER_NOT_OPEN: 'La oferta ya no está abierta.',
  PROPOSAL_NOT_FOUND: 'Propuesta no encontrada.',
  PROPOSAL_NOT_PENDING: 'La propuesta ya no está pendiente.',
  DUPLICATE_PROPOSAL: 'Ya tienes una propuesta pendiente para esta oferta.',
  CONCURRENCY_CONFLICT:
    'Otra persona modificó esta oferta o propuesta al mismo tiempo. Recarga e intenta de nuevo.',
  SELF_TRADE: 'No puedes proponer un trade sobre tu propia oferta.',
  COUNTER_OFFER_NOT_MATCHING:
    'Tu oferta vinculada no es la inversa exacta de esta oferta.',
  FORBIDDEN: 'No tienes permiso para realizar esta acción.',
  UNAUTHORIZED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  TOO_MANY_REQUESTS:
    'Demasiadas peticiones seguidas. Espera un momento e intenta de nuevo.',
  VALIDATION_ERROR: 'Revisa los datos ingresados e intenta de nuevo.',
  INTERNAL_ERROR: 'Ocurrió un error en el servidor. Intenta de nuevo.',
};

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

export function getErrorMessage(
  error: unknown,
  fallback = 'No se pudo completar la operación.',
): string {
  if (error instanceof ApiError) {
    if (error.error === 'VALIDATION_ERROR') {
      return FALLBACK_ERROR_MESSAGES.VALIDATION_ERROR;
    }
    if (error.error === 'HTTP_ERROR' && error.statusCode >= 500) {
      return 'El servidor no está disponible en este momento. Intenta de nuevo en unos segundos.';
    }
    const mapped = FALLBACK_ERROR_MESSAGES[error.error];
    return error.message.trim() || mapped || fallback;
  }

  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.';
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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
    (Array.isArray(record.message) &&
      record.message.every((item) => typeof item === 'string'));
  return (
    typeof record.statusCode === 'number' &&
    typeof record.error === 'string' &&
    hasValidMessage
  );
}

/**
 * Wrapper de fetch para la API REST (/api).
 * Agrega Authorization Bearer si hay sesión en localStorage y lanza ApiError en respuestas 4xx/5xx.
 * Ante un 401 fuera de /api/auth/login borra el token y notifica para redirigir a /login.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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

    if (response.status === 401 && !path.startsWith('/api/auth/login')) {
      clearStoredAuth();
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json();
  return data as T;
}
