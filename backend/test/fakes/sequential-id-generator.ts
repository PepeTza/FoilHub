import type { IdGenerator } from '../../src/application/ports/id-generator.port.js';

/** id-1, id-2, ... */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly prefix = 'id') {}

  next(): string {
    return `${this.prefix}-${++this.counter}`;
  }
}
