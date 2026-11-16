import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { DomainError } from '../../../domain/errors/domain-error.js';
import { DomainExceptionFilter } from './domain-exception.filter.js';

class OfferNotOpenError extends DomainError {
  constructor() {
    super('OFFER_NOT_OPEN', 'La oferta ya no está abierta');
  }
}

class UnmappedError extends DomainError {
  constructor() {
    super('SOMETHING_NEW', 'detalle');
  }
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();
  beforeAll(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('traduce un DomainError según la tabla de §3', () => {
    expect(filter.toBody(new OfferNotOpenError())).toEqual({
      statusCode: 409,
      error: 'OFFER_NOT_OPEN',
      message: 'La oferta ya no está abierta',
    });
  });

  it('un DomainError sin mapeo es 500 sin exponer detalles', () => {
    expect(filter.toBody(new UnmappedError())).toEqual({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    });
  });

  it('errores de ValidationPipe → 400 VALIDATION_ERROR con la lista de campos', () => {
    const body = filter.toBody(new BadRequestException(['username must be a string']));
    expect(body).toEqual({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: ['username must be a string'],
    });
  });

  it('401 de guards → UNAUTHORIZED', () => {
    expect(filter.toBody(new UnauthorizedException()).error).toBe('UNAUTHORIZED');
  });

  it('429 del throttler → TOO_MANY_REQUESTS', () => {
    const body = filter.toBody(new HttpException('Too Many', HttpStatus.TOO_MANY_REQUESTS));
    expect(body.statusCode).toBe(429);
    expect(body.error).toBe('TOO_MANY_REQUESTS');
  });

  it('ruta inexistente → 404 NOT_FOUND', () => {
    expect(filter.toBody(new NotFoundException()).error).toBe('NOT_FOUND');
  });

  it('cualquier otro error → 500 INTERNAL_ERROR sin el mensaje original', () => {
    const body = filter.toBody(new Error('password=secret'));
    expect(body).toEqual({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
    });
  });

  it('escribe status y body en la respuesta HTTP', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) };

    filter.catch(new OfferNotOpenError(), host as never);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'OFFER_NOT_OPEN' }));
  });
});
