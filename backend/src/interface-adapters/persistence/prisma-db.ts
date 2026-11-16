import { Prisma } from '../../generated/prisma/client.js';

/** El cliente completo o el `tx` de una transacción: los repositorios funcionan con ambos. */
export type PrismaDb = Prisma.TransactionClient;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Los ids son columnas `uuid`: buscar "abc" haría fallar a Postgres (500). Un id que no es
 * UUID simplemente no existe, así que el caso de uso responde OFFER_NOT_FOUND, etc.
 */
export function isUuid(id: string): boolean {
  return UUID.test(id);
}

/** Violación de un índice único (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
