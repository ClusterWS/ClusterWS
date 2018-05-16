import { randomBytes } from 'crypto';
import { CustomObject } from './types';

export function logError<T>(data: T): any {
  return console.log(`\x1b[31m${data}\x1b[0m`);
}

export function logReady<T>(data: T): any {
  return console.log(`\x1b[36m${data}\x1b[0m`);
}

export function logWarning<T>(data: T): any {
  return console.log(`\x1b[33m${data}\x1b[0m`);
}

export function isFunction<T>(fn: T): boolean {
  return {}.toString.call(fn) === '[object Function]';
}

export function generateKey(length: number): string {
  return (
    randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length) +
    `${Date.now()}` +
    randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length)
  );
}
