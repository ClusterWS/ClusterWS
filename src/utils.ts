import { randomBytes } from 'crypto';

export function noop(): void { /** ignore */ }

export function uuid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}
