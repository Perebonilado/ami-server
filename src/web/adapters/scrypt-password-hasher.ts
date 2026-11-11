import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHasherPort } from '../../business/ports/password-hasher.port.js';

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

export class ScryptPasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await scryptAsync(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [scheme, salt, expected] = hash.split('$');
    if (scheme !== 'scrypt' || !salt || !expected) return false;
    const expectedKey = Buffer.from(expected, 'base64');
    const key = await scryptAsync(password, Buffer.from(salt, 'base64'), expectedKey.length);
    return key.length === expectedKey.length && timingSafeEqual(key, expectedKey);
  }
}
