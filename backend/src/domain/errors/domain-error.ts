/**
 * Base de todos los errores de negocio. `code` es estable y lo usa
 * DomainExceptionFilter (capa 3) para elegir el status HTTP.
 * `message` es el texto para el usuario, en español.
 */
export abstract class DomainError extends Error {
  protected constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
