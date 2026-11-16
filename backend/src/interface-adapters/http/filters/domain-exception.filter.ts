import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../../../domain/errors/domain-error.js';

/** Formato de error del contrato (docs/ARCHITECTURE.md §6). */
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
}

/** Tabla `code` → HTTP de docs/ARCHITECTURE.md §3. */
export const DOMAIN_ERROR_STATUS: Readonly<Record<string, HttpStatus>> = {
  INVALID_USERNAME: HttpStatus.BAD_REQUEST,
  INVALID_CARD_CODE: HttpStatus.BAD_REQUEST,
  INVALID_QUANTITY: HttpStatus.BAD_REQUEST,
  WEAK_PASSWORD: HttpStatus.BAD_REQUEST,
  SAME_CARD_TRADE: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  CARD_NOT_FOUND: HttpStatus.NOT_FOUND,
  OFFER_NOT_FOUND: HttpStatus.NOT_FOUND,
  PROPOSAL_NOT_FOUND: HttpStatus.NOT_FOUND,
  USERNAME_TAKEN: HttpStatus.CONFLICT,
  OFFER_NOT_OPEN: HttpStatus.CONFLICT,
  PROPOSAL_NOT_PENDING: HttpStatus.CONFLICT,
  DUPLICATE_PROPOSAL: HttpStatus.CONFLICT,
  CONCURRENCY_CONFLICT: HttpStatus.CONFLICT,
  SELF_TRADE: HttpStatus.UNPROCESSABLE_ENTITY,
  COUNTER_OFFER_NOT_MATCHING: HttpStatus.UNPROCESSABLE_ENTITY,
};

/** Errores que no son de dominio pero vienen de Nest (pipes, guards, throttler, rutas). */
const HTTP_ERRORS: Readonly<Partial<Record<number, { error: string; message: string }>>> = {
  [HttpStatus.BAD_REQUEST]: { error: 'VALIDATION_ERROR', message: 'Datos inválidos' },
  [HttpStatus.UNAUTHORIZED]: { error: 'UNAUTHORIZED', message: 'Necesitas iniciar sesión' },
  [HttpStatus.FORBIDDEN]: { error: 'FORBIDDEN', message: 'No tienes permiso para hacer esto' },
  [HttpStatus.NOT_FOUND]: { error: 'NOT_FOUND', message: 'Recurso no encontrado' },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Demasiadas peticiones, intenta de nuevo en un momento',
  },
};

const INTERNAL_ERROR: ErrorResponseBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  error: 'INTERNAL_ERROR',
  message: 'Error interno del servidor',
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception);
    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }

  toBody(exception: unknown): ErrorResponseBody {
    if (exception instanceof DomainError) {
      const statusCode = DOMAIN_ERROR_STATUS[exception.code];
      if (statusCode !== undefined) {
        return { statusCode, error: exception.code, message: exception.message };
      }
      this.logger.error(`DomainError sin mapeo HTTP: ${exception.code}`);
      return INTERNAL_ERROR;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const known = HTTP_ERRORS[statusCode];
      if (known) {
        // ValidationPipe pone la lista de campos inválidos en `message`.
        const validationMessages =
          statusCode === HttpStatus.BAD_REQUEST ? messagesOf(exception) : undefined;
        return { statusCode, error: known.error, message: validationMessages ?? known.message };
      }
      if (statusCode < 500) {
        return { statusCode, error: 'HTTP_ERROR', message: exception.message };
      }
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return INTERNAL_ERROR;
  }
}

function messagesOf(exception: HttpException): string[] | undefined {
  const response = exception.getResponse();
  if (typeof response === 'object' && response !== null && 'message' in response) {
    const { message } = response;
    if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
      return message;
    }
  }
  return undefined;
}
