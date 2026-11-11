import { randomInt, randomUUID } from 'node:crypto';
import { formatLicenceNumber, LICENCE_ALPHABET } from '../../business/domain/values/licence-number.js';
import type { IdGeneratorPort } from '../../business/ports/id-generator.port.js';

export class RandomIdGenerator implements IdGeneratorPort {
  uuid(): string {
    return randomUUID();
  }

  licenceNumber(): string {
    return formatLicenceNumber(this.pick(LICENCE_ALPHABET, 8));
  }

  reference(prefix: string): string {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${this.pick(LICENCE_ALPHABET, 6)}`;
  }

  private pick(alphabet: string, length: number): string {
    return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');
  }
}
