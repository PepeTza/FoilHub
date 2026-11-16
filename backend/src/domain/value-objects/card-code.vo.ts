import { InvalidCardCodeError } from '../errors/domain-errors.js';

const CARD_CODE_PATTERN = /^[A-Z0-9]{1,6}-\d{2,3}$/;

/** Código impreso de la carta (`BT1-084`, `ST1-01`, `P-001`). Mayúsculas y sin espacios. */
export class CardCode {
  private constructor(readonly value: string) {}

  static create(raw: string): CardCode {
    const normalized = raw.replace(/\s+/g, '').toUpperCase();
    if (!CARD_CODE_PATTERN.test(normalized)) {
      throw new InvalidCardCodeError(raw);
    }
    return new CardCode(normalized);
  }

  /** Desde persistencia: el valor ya fue validado y normalizado. */
  static restore(value: string): CardCode {
    return new CardCode(value);
  }

  equals(other: CardCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
