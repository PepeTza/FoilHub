import { InvalidQuantityError } from '../errors/domain-errors.js';

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

/** Entero entre 1 y 99. */
export class Quantity {
  private constructor(readonly value: number) {}

  static create(raw: number): Quantity {
    if (!Number.isInteger(raw) || raw < MIN_QUANTITY || raw > MAX_QUANTITY) {
      throw new InvalidQuantityError();
    }
    return new Quantity(raw);
  }

  static restore(value: number): Quantity {
    return new Quantity(value);
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
