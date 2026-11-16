import { Prisma } from '../../generated/prisma/client.js';

/** El cliente completo o el `tx` de una transacción: los repositorios funcionan con ambos. */
export type PrismaDb = Prisma.TransactionClient;

/** Violación de un índice único (P2002). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
