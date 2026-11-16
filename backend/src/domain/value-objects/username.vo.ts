import { InvalidUsernameError } from '../errors/domain-errors.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

/** 3–20 caracteres `[a-zA-Z0-9_]`. Se guarda en minúsculas: es único sin distinguir mayúsculas. */
export class Username {
  private constructor(readonly value: string) {}

  static create(raw: string): Username {
    const trimmed = raw.trim();
    if (!USERNAME_PATTERN.test(trimmed)) {
      throw new InvalidUsernameError();
    }
    return new Username(trimmed.toLowerCase());
  }

  /** Desde persistencia: el valor ya fue validado y normalizado. */
  static restore(value: string): Username {
    return new Username(value);
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
