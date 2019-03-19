import { randomBytes } from 'crypto';

export function isFunction<T>(fn: T): boolean {
  return {}.toString.call(fn) === '[object Function]';
}

export function generateUid(length: number): string {
  return randomBytes(length).toString('hex');
}