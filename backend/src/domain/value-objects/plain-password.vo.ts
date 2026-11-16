import { WeakPasswordError } from '../errors/domain-errors.js';

export const MIN_PASSWORD_LENGTH = 8;
/** Límite de bcrypt. */
export const MAX_PASSWORD_LENGTH = 72;

/** Contraseña en texto plano. Solo existe en memoria: nunca se persiste ni se registra. */
export class PlainPassword {
  private constructor(readonly value: string) {}

  static create(raw: string): PlainPassword {
    if (raw.length < MIN_PASSWORD_LENGTH || raw.length > MAX_PASSWORD_LENGTH) {
      throw new WeakPasswordError();
    }
    return new PlainPassword(raw);
  }

  /** Evita que la contraseña aparezca si alguien registra el objeto. */
  toString(): string {
    return '[PlainPassword]';
  }

  toJSON(): string {
    return '[PlainPassword]';
  }
}
